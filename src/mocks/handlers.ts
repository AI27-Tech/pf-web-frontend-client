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
import { DEV_USER, catalogosWire, sesionWire, viajeDetalleWire, viajesWire } from './data';

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

  // Handler de bitácora DESCONECTADO (recorte al contrato): el contrato bff no define
  // GET /viajes/{id}/bitacora. El dato mock `bitacoraWire` se conserva en data.ts para
  // cuando se reconecte. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.

  // --- Catalogos ----------------------------------------------------------------
  http.get('*/api/v1/catalogos/:familia', async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json(catalogosWire[String(params.familia)] ?? []);
  }),

  // --- Conversaciones: DESCONECTADAS (recorte al contrato) ----------------------
  // El contrato bff no expone conversación al cliente (mensajeria.yaml es superficie
  // interna). Los handlers de /conversaciones se retiraron; los datos mock
  // (conversacionesWire, mensajesWire) se conservan en data.ts para cuando se
  // reconecte la feature de src/_desconectado/conversacion/.
  // Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
];
