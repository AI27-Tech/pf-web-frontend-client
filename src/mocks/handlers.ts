/*
 * Handlers de MSW: un `bff` y un `realtime` de mentira.
 *
 * Alcance deliberado: esto imita la FORMA de las respuestas, no el comportamiento del
 * backend. No hay maquina de estados de viaje, no hay autorizacion real y no hay
 * multi-tenancy. Sirve para trabajar en la UI y para que los e2e cubran el recorrido
 * autenticado; no sirve para validar reglas de negocio.
 *
 * Lo unico que se imita con rigor es lo que la UI tiene que saber leer:
 *   - la forma del listado, el detalle y el panel de viajes
 *   - la forma de la conversacion, con su secuencia DE DOMINIO
 *   - la taxonomia de errores: 401 para credenciales
 *
 * El seguimiento vivo —la ruta pull `/viajes/{id}/tracking` y el stream SSE `/stream`—
 * era V2 y se retiro del release path de V1 (E9-T10 / F-06). Su `realtime` simulado
 * vive ahora en `prototipos-v2/seguimiento-vivo/mocks/stream.ts` y ya no se registra.
 *
 * Los patrones empiezan por `*` para casar con cualquier origen: asi da igual si la
 * app apunta a localhost, a un origen falso o a una URL relativa.
 */

import { HttpResponse, delay, http } from 'msw';
import { EstadoViaje, puedeTransicionar } from '@/lib/contracts';
import {
  DEV_USER,
  catalogosWire,
  conversacionesWire,
  emergenciasWire,
  mensajesWire,
  sesionWire,
  viajeDetalleWire,
  viajesWire,
  type MensajeClienteWireMock,
} from './data';

/** Latencia artificial: sin ella los estados de carga nunca se ven. */
const LATENCY_MS = 250;

export const handlers = [
  // --- Sesion -------------------------------------------------------------------
  http.post('*/api/v1/sesion', async ({ request }) => {
    await delay(LATENCY_MS);

    const body = (await request.json()) as {
      usuario?: string;
      contrasena?: string;
      segundo_factor?: string | null;
    };
    const credencialOk =
      body.usuario === DEV_USER.usuario && body.contrasena === DEV_USER.contrasena;
    const segundoFactorOk = (body.segundo_factor ?? '').trim() === DEV_USER.segundoFactor;

    if (!credencialOk || !segundoFactorOk) {
      /*
       * 401, no 404. La app distingue "credenciales invalidas" de "el servicio no
       * esta", y devolver el codigo correcto es lo que permite comprobar que esa
       * distincion funciona.
       */
      return HttpResponse.json({ error: 'credenciales invalidas' }, { status: 401 });
    }

    return HttpResponse.json(sesionWire());
  }),

  http.post('*/api/v1/sesion/refresh', async ({ request }) => {
    await delay(LATENCY_MS);
    if (
      request.headers.get('x-mock-session-cut') === '1' ||
      request.headers.get('cookie')?.includes('ai27-mock-session-cut=1')
    ) {
      return HttpResponse.json({ detail: 'Sesión revocada' }, { status: 401 });
    }
    const body = (await request.json()) as { refresh_token?: string };
    if (body.refresh_token !== 'mock.refresh-1') {
      return HttpResponse.json({ detail: 'refresh_token requerido' }, { status: 401 });
    }
    return HttpResponse.json({ ...sesionWire(), access_token: 'mock.jwt.no-firmado.refrescado' });
  }),

  http.delete('*/api/v1/sesion', async () => {
    await delay(LATENCY_MS);
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Panel de control: DESCONECTADO (recorte al contrato) ---------------------
  // El contrato bff no define GET /api/v1/panel. El handler se retiró; el builder
  // `panelWire` se conserva en data.ts para cuando se reconecte el panel de
  // src/_desconectado/panel/. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.

  // --- Viajes -------------------------------------------------------------------
  // El filtrado por `estado` es del SERVIDOR (listarViajes acepta `estado` y `cursor`).
  // El mock imita esa forma: si llega `?estado=X`, devuelve solo los viajes en ese
  // estado; sin el, devuelve todos del alcance. No imita el `cursor` (V1 recorta la
  // pagina en cliente todavia). El alcance de tenant lo deriva bff del token: el mock
  // NO recibe ni filtra por tenant (P9, P10).
  http.get('*/api/v1/viajes', async ({ request }) => {
    await delay(LATENCY_MS);
    // Corte de sesion revocada (E8-T6): antes de servir datos, una sesion cortada
    // responde 401, igual que /sesion/refresh.
    if (
      request.headers.get('x-mock-session-cut') === '1' ||
      request.headers.get('cookie')?.includes('ai27-mock-session-cut=1')
    ) {
      return HttpResponse.json({ detail: 'Sesión finalizada' }, { status: 401 });
    }
    const estado = new URL(request.url).searchParams.get('estado');
    const items = estado === null ? viajesWire : viajesWire.filter((v) => v.estado === estado);
    return HttpResponse.json(items);
  }),

  http.post('*/api/v1/viajes', async ({ request }) => {
    await delay(LATENCY_MS);
    // Devuelve la forma de contrato `ViajeResumen` ({id, estado, origen}). El estado
    // inicial lo decide `operacion`, no el cliente: siempre SOLICITADO (§C.1).
    const body = (await request.json().catch(() => ({}))) as { origen?: string };
    return HttpResponse.json(
      { id: 'viaje-nuevo', estado: 'SOLICITADO', origen: body.origen ?? 'Origen pendiente' },
      { status: 201 },
    );
  }),

  http.get('*/api/v1/viajes/:viajeId', async ({ params }) => {
    await delay(LATENCY_MS);
    const detalle = viajeDetalleWire[String(params.viajeId)];
    if (detalle === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(detalle);
  }),

  // --- Transición de estado pedida por el cliente (E1-HU-002, E9-T7) ------------
  // El cliente solo puede llevar SU viaje a CANCELADO o RECHAZADO_POR_CLIENTE
  // (DEC-005/DEC-111).
  http.post('*/api/v1/viajes/:viajeId/transiciones-cliente', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const viajeId = String(params.viajeId);
    const detalle = viajeDetalleWire[viajeId] as
      | {
          id: string;
          hito: { estado: string; etiqueta?: string };
          eta: unknown;
          incidencias: unknown;
        }
      | undefined;
    // 404, no 403: no revela si el viaje existe cuando está fuera de alcance.
    if (detalle === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { a_estado?: string; causa?: string };
    const causa = (body.causa ?? '').trim();
    // 400: el motivo es OBLIGATORIO en ambas acciones (DEC-111).
    if (causa === '') {
      return HttpResponse.json(
        { codigo: 'causa_requerida', error: 'El motivo es obligatorio.' },
        { status: 400 },
      );
    }

    const aEstado = body.a_estado;
    if (aEstado !== 'CANCELADO' && aEstado !== 'RECHAZADO_POR_CLIENTE') {
      // Arista que no corresponde al cliente: fuera del carril normal (403 en contrato).
      return HttpResponse.json(
        { codigo: 'arista_no_permitida', error: 'Transición no disponible para el cliente.' },
        { status: 403 },
      );
    }

    // 409: la máquina de estados (ADR 19) no permite la arista desde el estado actual
    // (p. ej. el viaje ya salió o ya es terminal).
    if (!puedeTransicionar(detalle.hito.estado as EstadoViaje, aEstado as EstadoViaje)) {
      return HttpResponse.json(
        { codigo: 'transicion_no_permitida', error: 'El viaje ya no puede cambiar a ese estado.' },
        { status: 409 },
      );
    }

    // Aplica la transición en el estado mutable del detalle (el listado `viajesWire` es
    // inmutable `as const`; el detalle es lo que la vista relee).
    detalle.hito = {
      estado: aEstado,
      etiqueta: aEstado === 'CANCELADO' ? 'Cancelado' : 'Rechazado',
    };

    // 200: el ViajeSeguimiento YA actualizado (misma forma que GET). Sin segundo GET.
    return HttpResponse.json(detalle);
  }),

  // Handler de bitácora DESCONECTADO (recorte al contrato): el contrato bff no define
  // GET /viajes/{id}/bitacora. El dato mock `bitacoraWire` se conserva en data.ts para
  // cuando se reconecte. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.

  // --- Emergencias (E9-T9, ADR 21 §6) -------------------------------------------
  // El mock imita la PROYECCIÓN por audiencia del bff: el cliente solo ve
  // {id, estado, activada_en} por caso y el agregado emergencia_activa. Las notas, el
  // activacion_id y cualquier dato interno NO salen en la respuesta. El estado vive en
  // `emergenciasWire` (mutable) para que activar y agregar nota surtan efecto.
  http.get('*/api/v1/viajes/:viajeId/emergencias', async ({ params }) => {
    await delay(LATENCY_MS);
    const casos = emergenciasWire[String(params.viajeId)] ?? [];
    return HttpResponse.json({
      emergencia_activa: casos.some((c) => c.estado === 'abierta' || c.estado === 'en_atencion'),
      // Proyección a la vista cliente: se DESCARTAN notas y activacion_id.
      casos: casos.map((c) => ({ id: c.id, estado: c.estado, activada_en: c.activada_en })),
    });
  }),

  http.post('*/api/v1/viajes/:viajeId/emergencias', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const viajeId = String(params.viajeId);
    const body = (await request.json().catch(() => ({}))) as { activacion_id?: string };
    const activacionId = body.activacion_id ?? '';
    const casos = (emergenciasWire[viajeId] ??= []);

    // Idempotencia por activacion_id: reentrega del MISMO id → caso original (200);
    // id nuevo → caso nuevo (201). Es la regla contractual del ticket.
    const existente = casos.find((c) => c.activacion_id === activacionId);
    if (existente !== undefined) {
      return HttpResponse.json(
        { id: existente.id, estado: existente.estado, activada_en: existente.activada_en },
        { status: 200 },
      );
    }

    const nuevo = {
      id: `emg-${casos.length + 1}-${Date.now()}`,
      estado: 'abierta' as const,
      activada_en: new Date().toISOString(),
      notas: [] as string[],
      activacion_id: activacionId,
    };
    casos.push(nuevo);
    return HttpResponse.json(
      { id: nuevo.id, estado: nuevo.estado, activada_en: nuevo.activada_en },
      { status: 201 },
    );
  }),

  http.post('*/api/v1/viajes/:viajeId/emergencias/:eid/notas', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const casos = emergenciasWire[String(params.viajeId)] ?? [];
    const caso = casos.find((c) => c.id === String(params.eid));
    if (caso === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as { cuerpo?: string };
    const cuerpo = (body.cuerpo ?? '').trim();
    // El contrato recorta y no guarda si queda vacío; el mock imita el no-guardado.
    if (cuerpo !== '') caso.notas.push(cuerpo);
    // 201 sin cuerpo, como el contrato.
    return new HttpResponse(null, { status: 201 });
  }),

  // --- Catalogos ----------------------------------------------------------------
  http.get('*/api/v1/catalogos/:familia', async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json(catalogosWire[String(params.familia)] ?? []);
  }),

  // --- Conversación del viaje (E9-T8 / E3-HU-014, audiencia Cliente) ------------
  // Una conversación POR VIAJE, anclada al viaje (nunca a un conversacion_id). El mock
  // imita la PROYECCIÓN del bff: el cliente ve {viaje_id, estado, atendida} y, por
  // mensaje, {id, secuencia, cuerpo, enviado_en, de_cliente} — nunca actor_real, rol
  // interno, bandeja ni pool. La historia se pagina POR SECUENCIA (antes_de/despues_de),
  // no por cursor. El envío es idempotente por client_message_id del CUERPO.
  http.get('*/api/v1/viajes/:viajeId/conversacion', async ({ params }) => {
    await delay(LATENCY_MS);
    const conv = conversacionesWire[String(params.viajeId)];
    if (conv === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }
    // Vista mínima del cliente: sin conversacion_id ni nada interno.
    return HttpResponse.json({
      viaje_id: conv.viaje_id,
      estado: conv.estado,
      atendida: conv.atendida,
    });
  }),

  http.get('*/api/v1/viajes/:viajeId/conversacion/mensajes', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const viajeId = String(params.viajeId);
    if (conversacionesWire[viajeId] === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }
    const url = new URL(request.url);
    const antesDe = url.searchParams.get('antes_de');
    const despuesDe = url.searchParams.get('despues_de');
    const limiteParam = url.searchParams.get('limite');
    const limite = Math.min(200, Math.max(1, limiteParam === null ? 50 : Number(limiteParam)));

    // Fuente ordenada por secuencia de dominio. El mock la ordena aquí para imitar al
    // servidor; el cliente igual reordena/deduplica.
    const todos = [...(mensajesWire[viajeId] ?? [])].sort((a, b) => a.secuencia - b.secuencia);

    // `antes_de` y `despues_de` son mutuamente excluyentes: `antes_de` manda si ambos.
    let seleccion: MensajeClienteWireMock[];
    let hayMas: boolean;
    if (antesDe !== null) {
      // Hacia atrás (historia): los de secuencia menor, la página más cercana al corte.
      const menores = todos.filter((m) => m.secuencia < Number(antesDe));
      seleccion = menores.slice(Math.max(0, menores.length - limite));
      hayMas = menores.length > limite;
    } else if (despuesDe !== null) {
      // Hacia adelante (catch-up): los de secuencia mayor, en orden.
      const mayores = todos.filter((m) => m.secuencia > Number(despuesDe));
      seleccion = mayores.slice(0, limite);
      hayMas = mayores.length > limite;
    } else {
      // Sin filtro: los más recientes (la cola de la historia).
      seleccion = todos.slice(Math.max(0, todos.length - limite));
      hayMas = todos.length > limite;
    }

    // Proyección a la vista cliente: se DESCARTA client_message_id.
    return HttpResponse.json({
      items: seleccion.map((m) => ({
        id: m.id,
        secuencia: m.secuencia,
        cuerpo: m.cuerpo,
        enviado_en: m.enviado_en,
        de_cliente: m.de_cliente,
      })),
      hay_mas: hayMas,
    });
  }),

  http.post('*/api/v1/viajes/:viajeId/conversacion/mensajes', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const viajeId = String(params.viajeId);
    const conv = conversacionesWire[viajeId];
    if (conv === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      cuerpo?: string;
      client_message_id?: string;
    };
    const cuerpo = (body.cuerpo ?? '').trim();
    const clientMessageId = body.client_message_id ?? '';

    // 400: el cuerpo es obligatorio (minLength 1). El client_message_id también.
    if (cuerpo === '' || clientMessageId === '') {
      return HttpResponse.json(
        { codigo: 'cuerpo_requerido', error: 'El mensaje no puede ir vacío.' },
        { status: 400 },
      );
    }

    // 409: la conversación no admite escritura (ventana vencida tras el cierre,
    // DEC-030/DEC-041). `codigo` de máquina `conversacion_solo_lectura`.
    if (conv.estado !== 'abierta') {
      return HttpResponse.json(
        {
          codigo: 'conversacion_solo_lectura',
          error: 'La conversación no admite nuevos mensajes.',
        },
        { status: 409 },
      );
    }

    const historia = (mensajesWire[viajeId] ??= []);

    // Idempotencia por client_message_id: reentrega del MISMO id → mensaje original (200);
    // id nuevo → mensaje nuevo (201). Es la regla contractual del ticket.
    const existente = historia.find((m) => m.client_message_id === clientMessageId);
    if (existente !== undefined) {
      return HttpResponse.json(
        {
          id: existente.id,
          secuencia: existente.secuencia,
          cuerpo: existente.cuerpo,
          enviado_en: existente.enviado_en,
          de_cliente: existente.de_cliente,
        },
        { status: 200 },
      );
    }

    const siguienteSeq = historia.reduce((max, m) => Math.max(max, m.secuencia), 0) + 1;
    const nuevo: MensajeClienteWireMock = {
      id: `m-nuevo-${siguienteSeq}-${Date.now()}`,
      secuencia: siguienteSeq,
      cuerpo,
      enviado_en: new Date().toISOString(),
      de_cliente: true,
      client_message_id: clientMessageId,
    };
    historia.push(nuevo);
    return HttpResponse.json(
      {
        id: nuevo.id,
        secuencia: nuevo.secuencia,
        cuerpo: nuevo.cuerpo,
        enviado_en: nuevo.enviado_en,
        de_cliente: nuevo.de_cliente,
      },
      { status: 201 },
    );
  }),
];
