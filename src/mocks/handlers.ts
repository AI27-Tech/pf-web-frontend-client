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
import {
  DEV_USER,
  bitacoraWire,
  catalogosWire,
  conversacionesWire,
  mensajesWire,
  panelWire,
  sesionWire,
  viajeDetalleWire,
  viajesWire,
} from './data';

/** Latencia artificial: sin ella los estados de carga nunca se ven. */
const LATENCY_MS = 250;

export const handlers = [
  // --- Sesion -------------------------------------------------------------------
  http.post('*/api/v1/sesion', async ({ request }) => {
    await delay(LATENCY_MS);

    const body = (await request.json()) as { usuario?: string; contrasena?: string };

    if (body.usuario !== DEV_USER.usuario || body.contrasena !== DEV_USER.contrasena) {
      /*
       * 401, no 404. La app distingue "credenciales invalidas" de "el servicio no
       * esta", y devolver el codigo correcto es lo que permite comprobar que esa
       * distincion funciona.
       */
      return HttpResponse.json({ error: 'credenciales invalidas' }, { status: 401 });
    }

    return HttpResponse.json(sesionWire());
  }),

  http.post('*/api/v1/sesion/refresh', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ ...sesionWire(), access_token: 'mock.jwt.no-firmado.refrescado' });
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
];
