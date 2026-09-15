/*
 * Handlers de MSW: un `bff` y un `realtime` de mentira.
 *
 * Alcance deliberado: esto imita la FORMA de las respuestas, no el comportamiento del
 * backend. No hay maquina de estados de viaje, no hay autorizacion real y no hay
 * multi-tenancy. Sirve para trabajar en la UI y para que los e2e cubran el recorrido
 * autenticado; no sirve para validar reglas de negocio.
 *
 * Lo unico que se imita con rigor es lo que la UI tiene que saber leer:
 *   - la forma del payload de seguimiento, incluida la ausencia MARCADA
 *   - la forma del sobre SSE, con su `seq` de transporte separado del de dominio
 *   - la taxonomia de errores: 401 para credenciales, 503 para degradacion
 *
 * Los patrones empiezan por `*` para casar con cualquier origen: asi da igual si la
 * app apunta a localhost, a un origen falso o a una URL relativa.
 */

import { HttpResponse, delay, http } from 'msw';
import {
  DEV_USER,
  bitacoraWire,
  catalogosWire,
  conversacionesWire,
  mensajesWire,
  panelWire,
  seguimientoWire,
  viajeDetalleWire,
  viajesWire,
} from './data';
import { streamResponse } from './stream';

/** Latencia artificial: sin ella los estados de carga nunca se ven. */
const LATENCY_MS = 250;

export const handlers = [
  // --- Sesion -------------------------------------------------------------------
  http.post('*/api/v1/sesion', async ({ request }) => {
    await delay(LATENCY_MS);

    const body = (await request.json()) as { usuario?: string; password?: string };

    if (body.usuario !== DEV_USER.usuario || body.password !== DEV_USER.password) {
      /*
       * 401, no 404. La app distingue "credenciales invalidas" de "el servicio no
       * esta", y devolver el codigo correcto es lo que permite comprobar que esa
       * distincion funciona.
       */
      return HttpResponse.json({ error: 'credenciales invalidas' }, { status: 401 });
    }

    return HttpResponse.json({
      access_token: 'mock.jwt.no-firmado',
      // Vida corta a proposito: hace visible el bucle de refresco de SessionContext.
      expira_en: new Date(Date.now() + 15 * 60_000).toISOString(),
      requiere_segundo_factor: false,
    });
  }),

  http.post('*/api/v1/sesion/refresh', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      access_token: 'mock.jwt.no-firmado.refrescado',
      expira_en: new Date(Date.now() + 15 * 60_000).toISOString(),
      requiere_segundo_factor: false,
    });
  }),

  http.delete('*/api/v1/sesion', async () => {
    await delay(LATENCY_MS);
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Panel de control ---------------------------------------------------------
  /*
   * Una sola respuesta agregada: es bff quien compone indicadores, viajes y
   * notificaciones a partir de varios servicios. El cliente hace un GET, no cuatro.
   */
  http.get('*/api/v1/panel', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(panelWire());
  }),

  // --- Viajes -------------------------------------------------------------------
  http.get('*/api/v1/viajes', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(viajesWire);
  }),

  http.post('*/api/v1/viajes', async () => {
    await delay(LATENCY_MS);
    // El estado inicial lo decide `operacion`, no el cliente: siempre SOLICITADO.
    return HttpResponse.json({ id: 'viaje-3' }, { status: 201 });
  }),

  http.get('*/api/v1/viajes/:viajeId', async ({ params }) => {
    await delay(LATENCY_MS);
    const detalle = viajeDetalleWire[String(params.viajeId)];
    if (detalle === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(detalle);
  }),

  /*
   * LA RUTA PULL. Es la carga inicial y tambien la ruta de degradacion: cuando el
   * stream no entrega, la app hace polling contra aqui con el mismo parser.
   */
  http.get('*/api/v1/viajes/:viajeId/tracking', async ({ params }) => {
    await delay(LATENCY_MS);
    const viajeId = String(params.viajeId);
    if (viajeDetalleWire[viajeId] === undefined) {
      return HttpResponse.json({ error: 'no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(seguimientoWire(viajeId, 1));
  }),

  http.get('*/api/v1/viajes/:viajeId/bitacora', async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json(bitacoraWire[String(params.viajeId)] ?? []);
  }),

  // --- Catalogos ----------------------------------------------------------------
  http.get('*/api/v1/catalogos/:familia', async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json(catalogosWire[String(params.familia)] ?? []);
  }),

  // --- Conversaciones -----------------------------------------------------------
  http.get('*/api/v1/conversaciones', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(conversacionesWire);
  }),

  http.get('*/api/v1/conversaciones/:conversacionId/mensajes', async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json(mensajesWire[String(params.conversacionId)] ?? []);
  }),

  http.post('*/api/v1/conversaciones/:conversacionId/mensajes', async ({ params, request }) => {
    await delay(LATENCY_MS);

    const conversacionId = String(params.conversacionId);
    const body = (await request.json()) as { cuerpo?: string };
    const existing = mensajesWire[conversacionId] ?? [];

    /*
     * La secuencia de dominio la asigna el servidor, dentro de su transaccion. El
     * cliente no la propone, y este mock respeta eso.
     */
    const nextSeq = existing.reduce((max, m) => Math.max(max, m.seq), 0) + 1;

    const created = {
      id: `m-${crypto.randomUUID().slice(0, 8)}`,
      seq: nextSeq,
      cuerpo: body.cuerpo ?? '',
      enviado_en: new Date().toISOString(),
      de_cliente: true,
    };

    mensajesWire[conversacionId] = [...existing, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post('*/api/v1/conversaciones/:conversacionId/receipts/lectura', async () => {
    await delay(LATENCY_MS);
    return new HttpResponse(null, { status: 204 });
  }),

  // --- El stream de `realtime` --------------------------------------------------
  http.get('*/api/v1/stream', ({ request }) => streamResponse(request)),
];
