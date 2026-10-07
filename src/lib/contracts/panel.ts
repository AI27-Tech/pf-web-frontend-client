/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * Lo que el panel de control necesita para pintarse: tres indicadores, los viajes en
 * curso y las notificaciones recientes.
 *
 * Dos decisiones que no son de estilo:
 *
 *   1. El ETA de un viaje en curso es `Fresco<Eta>`, no `Eta | null`. Un viaje cuyo
 *      `procesamiento` esta caido no tiene "ETA nulo": tiene un ETA que no podemos
 *      consultar ahora, y la tabla lo dice con esas palabras. Colapsar los dos casos
 *      en `null` es la version tabular del "mapa que miente".
 *   2. `NivelRiesgo` y `SeveridadNotificacion` son uniones ABIERTAS, igual que
 *      `EstadoViaje`. El contrato de estados no existe todavia. La UI presenta lo
 *      que conoce y degrada a un tono neutro lo que no.
 *
 * TODO(contracts): confirmar nombres y catalogos contra contracts/openapi/bff.yaml.
 */

import type { CondicionActiva, EstadoViaje } from './estados';
import type { Fresco } from './freshness';
import type { Eta } from './eta';

/** Viajes en curso ahora mismo, y la variacion respecto al dia anterior. */
export interface IndicadorViajesActivos {
  readonly total: number;
  /** Puede ser negativo. */
  readonly deltaDesdeAyer: number;
}

/**
 * Nivel de riesgo agregado de la flota del cliente.
 *
 * Union abierta: `BAJO_NORMAL` es el unico valor que el diseno muestra hoy, y
 * `string` mantiene representables los demas sin inventarlos.
 */
export type NivelRiesgo = 'BAJO_NORMAL' | (string & {});

export interface IndicadorRiesgoGlobal {
  readonly nivel: NivelRiesgo;
  /** Porcentaje de unidades sin incidencia. 0–100. */
  readonly unidadesSegurasPct: number;
}

export interface IndicadorAlertas {
  readonly total: number;
}

/**
 * Estado de seguimiento de un viaje, tal como lo pinta la pantalla de Seguimiento en
 * Vivo ("Ruta Segura", "Desvío Detectado", "En Tránsito").
 *
 * `tono` e `icono` son uniones abiertas, igual que el resto de catalogos del panel.
 * Un valor que la UI no reconoce se pinta en neutro en lugar de romper.
 */
export interface EstadoSeguimiento {
  readonly etiqueta: string;
  readonly tono: 'success' | 'warning' | 'info' | (string & {});
  readonly icono: 'ruta-segura' | 'desvio-detectado' | 'en-transito' | (string & {});
}

/**
 * Una fila de "Viajes en Curso", y tambien la tarjeta de "Viajes Activos" de
 * Seguimiento en Vivo: las dos pantallas comparten el mismo viaje en curso, asi que
 * comparten el mismo contrato en lugar de tener uno cada una.
 *
 * `progresoPct`, `estadoSeguimiento`, `velocidadPromedioKmh`, `temperaturaCargaC` y
 * `bateriaGpsPct` son campos que la tabla del panel no pinta pero que Seguimiento en
 * Vivo si necesita: viven aqui y no en un contrato aparte porque describen el mismo
 * viaje, no una vista distinta de el.
 */
export interface ViajeEnCurso {
  readonly viajeId: string;
  readonly folio: string;
  readonly origen: string;
  readonly destino: string;
  readonly estado: EstadoViaje;
  readonly condicionesActivas: readonly CondicionActiva[];
  readonly eta: Fresco<Eta>;
  /** Nombre del operador asignado a la unidad. */
  readonly operadorNombre: string;
  /** Avance del trayecto, 0–100. */
  readonly progresoPct: number;
  readonly estadoSeguimiento: EstadoSeguimiento;
  readonly velocidadPromedioKmh: number;
  readonly temperaturaCargaC: number;
  /** Carga de bateria del dispositivo GPS, 0–100. */
  readonly bateriaGpsPct: number;
}

export type SeveridadNotificacion = 'critica' | 'informativa' | (string & {});

export interface NotificacionPanel {
  readonly id: string;
  readonly severidad: SeveridadNotificacion;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly ocurrioEn: string;
}

export interface PanelDeControl {
  readonly viajesActivos: IndicadorViajesActivos;
  readonly riesgoGlobal: IndicadorRiesgoGlobal;
  readonly alertasActivas: IndicadorAlertas;
  readonly viajesEnCurso: readonly ViajeEnCurso[];
  readonly notificaciones: readonly NotificacionPanel[];
}
