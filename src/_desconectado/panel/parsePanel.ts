/*
 * El parser del panel de control: forma de contrato -> modelo de la app.
 *
 * Es puro, como el de seguimiento: sin fetch, sin reloj, sin DOM. Y reutiliza los
 * lectores de `lib/wire/` en lugar de traer su propia version de "leer un campo
 * marcado", porque la regla "ausente por degradacion no es ausente" tiene que
 * cumplirse igual aqui que en el seguimiento — el ETA de la tabla y el ETA del mapa
 * son el mismo dato con el mismo problema.
 *
 * Lo que este modulo NO hace: rellenar espacios. Si un indicador no llega, es un error
 * de contrato y se levanta como tal. Un `0` por defecto convertiria "no lo sabemos"
 * en "no hay viajes activos", que es una afirmacion que el panel no puede hacer.
 */

import type { Eta, EstadoViaje, Fresco } from '@/lib/contracts';
import type { NotificacionPanel, PanelDeControl, ViajeEnCurso } from './tipos';
import { parseCondicionesWire, parseEtaWire } from './parseEtaWire';
import {
  WireError,
  isRecord,
  parseFrescoWire,
  requireNumber,
  requireRecord,
  requireString,
} from '@/lib/wire/readers';

/** Error de forma del payload del panel. Es 'roto', no 'degradado'. */
export class PanelPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PanelPayloadError';
  }
}

function parseEtaFresco(raw: unknown): Fresco<Eta> {
  return parseFrescoWire(raw, parseEtaWire);
}

function parseViajeEnCurso(raw: unknown): ViajeEnCurso {
  const viaje = requireRecord(raw, 'un viaje en curso');

  return {
    viajeId: requireString(viaje, 'viaje_id'),
    folio: requireString(viaje, 'folio'),
    origen: requireString(viaje, 'origen'),
    destino: requireString(viaje, 'destino'),
    // El estado llega como string del wire; se tipa como EstadoViaje en la frontera
    // de parseo (el servidor es la autoridad del valor). Panel pendiente de retiro.
    estado: requireString(viaje, 'estado') as EstadoViaje,
    condicionesActivas: parseCondicionesWire(viaje['condiciones_activas']),
    eta: parseEtaFresco(viaje['eta']),
  };
}

function parseNotificacion(raw: unknown): NotificacionPanel {
  const notificacion = requireRecord(raw, 'una notificacion');

  return {
    id: requireString(notificacion, 'id'),
    // Union abierta: una severidad que no conocemos atraviesa el parser intacta.
    severidad: requireString(notificacion, 'severidad'),
    titulo: requireString(notificacion, 'titulo'),
    cuerpo: requireString(notificacion, 'cuerpo'),
    ocurrioEn: requireString(notificacion, 'ocurrio_en'),
  };
}

/** Lista opcional: si el campo no llega, la seccion se pinta vacia, no rota. */
function parseLista<T>(raw: unknown, parseItem: (item: unknown) => T): readonly T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseItem);
}

/**
 * Convierte el cuerpo de `GET /api/v1/panel` en el modelo que consume la UI.
 *
 * Traduce los fallos estructurales de `lib/wire/` a `PanelPayloadError` por la misma
 * razon que el parser de seguimiento traduce a `SeguimientoPayloadError`: quien llama trata
 * con el error de este modulo, no con el detalle de la lectura.
 */
export function parsePanel(raw: unknown): PanelDeControl {
  try {
    if (!isRecord(raw)) {
      throw new PanelPayloadError('El payload del panel no es un objeto');
    }

    const viajesActivos = requireRecord(raw['viajes_activos'], '"viajes_activos"');
    const riesgoGlobal = requireRecord(raw['riesgo_global'], '"riesgo_global"');
    const alertasActivas = requireRecord(raw['alertas_activas'], '"alertas_activas"');

    return {
      viajesActivos: {
        total: requireNumber(viajesActivos, 'total'),
        deltaDesdeAyer: requireNumber(viajesActivos, 'delta_desde_ayer'),
      },
      riesgoGlobal: {
        // Union abierta: un nivel desconocido llega intacto y lo resuelve la UI.
        nivel: requireString(riesgoGlobal, 'nivel'),
        unidadesSegurasPct: requireNumber(riesgoGlobal, 'unidades_seguras_pct'),
      },
      alertasActivas: {
        total: requireNumber(alertasActivas, 'total'),
      },
      viajesEnCurso: parseLista(raw['viajes_en_curso'], parseViajeEnCurso),
      notificaciones: parseLista(raw['notificaciones'], parseNotificacion),
    };
  } catch (cause) {
    if (cause instanceof WireError) {
      throw new PanelPayloadError(cause.message);
    }
    throw cause;
  }
}
