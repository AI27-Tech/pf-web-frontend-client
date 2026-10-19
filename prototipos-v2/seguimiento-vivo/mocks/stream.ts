/*
 * Un `realtime` de mentira: SSE de verdad sobre un ReadableStream.
 *
 * Imita las cuatro cosas del protocolo que el cliente tiene que saber manejar:
 *
 *   1. Snapshot de apertura. Al conectar, el estado actual de cada canal ANTES de los
 *      pendientes — es lo que hace que la pantalla no arranque vacia.
 *   2. `seq` de transporte incremental, y reanudacion por `Last-Event-ID`.
 *   3. Latido cada 4 s como comentario SSE de un byte.
 *   4. Sobres con su prioridad, TTL y `dedup_key` ya aplicados por el servidor.
 *
 * El detalle importante: el `seq` de transporte arranca en 1000 y avanza de uno en
 * uno, mientras la secuencia DE DOMINIO arranca en 1. Son numeros distintos a
 * proposito, para que cualquier confusion entre los dos se vea en pantalla en lugar
 * de esconderse tras una coincidencia numerica.
 */

import { HttpResponse } from 'msw';
import { seguimientoWire } from './data';
import { STREAM_TIMINGS } from '@/lib/constants';

/** Cadencia de las posiciones. `posicion.actualizada` es prioridad baja, TTL 30 s. */
const POSICION_CADENCIA_MS = 2_000;

/** Canales que el mock sabe alimentar. Los demas se aceptan y quedan en silencio. */
const CANALES_CON_TRAFICO = new Set(['viaje:viaje-1']);

function sobreDePosicion(viajeId: string, transportSeq: number, domainSeq: number): string {
  const sobre = {
    seq: transportSeq,
    tipo: 'posicion.actualizada',
    prioridad: 'baja',
    ttl_seg: 30,
    dedup_key: `posicion:${viajeId}`,
    ts: new Date().toISOString(),
    // El payload es el MISMO que sirve la ruta pull. Ahi esta la gracia (P4).
    payload: seguimientoWire(viajeId, domainSeq),
  };

  return `id: ${transportSeq}\ndata: ${JSON.stringify(sobre)}\n\n`;
}

export function streamResponse(request: Request): Response {
  const url = new URL(request.url);
  const canales = (url.searchParams.get('canales') ?? '').split(',').filter(Boolean);

  // Reanudacion: el cliente manda el ultimo seq que recibio de verdad.
  const lastEventId = request.headers.get('Last-Event-ID');
  let transportSeq = lastEventId !== null ? Number(lastEventId) : 1000;
  let domainSeq = 1;

  const encoder = new TextEncoder();
  let posicionTimer: ReturnType<typeof setInterval> | undefined;
  let latidoTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const viajesConTrafico = canales.filter((canal) => CANALES_CON_TRAFICO.has(canal));

      // (1) Snapshot de apertura, por cada canal con datos.
      for (const canal of viajesConTrafico) {
        const viajeId = canal.slice('viaje:'.length);
        transportSeq += 1;
        controller.enqueue(encoder.encode(sobreDePosicion(viajeId, transportSeq, domainSeq)));
      }

      // (3) El latido no es opcional: sin el, una conexion muerta parece viva.
      latidoTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':\n\n'));
        } catch {
          // El cliente cerro; `cancel` limpia los temporizadores.
        }
      }, STREAM_TIMINGS.heartbeatMs);

      if (viajesConTrafico.length === 0) return;

      // (2) y (4) Posiciones nuevas, con las dos secuencias avanzando por separado.
      posicionTimer = setInterval(() => {
        transportSeq += 1;
        domainSeq += 1;

        for (const canal of viajesConTrafico) {
          const viajeId = canal.slice('viaje:'.length);
          try {
            controller.enqueue(encoder.encode(sobreDePosicion(viajeId, transportSeq, domainSeq)));
          } catch {
            // idem
          }
        }
      }, POSICION_CADENCIA_MS);

      /*
       * TODO(contracts): aqui iria la senal de "estoy vivo pero no recibo" para poder
       * demostrar el estado `vivo-sin-datos` del cliente. No se emite porque la FORMA
       * de esa senal no esta especificada en docs/arquitectura/ — solo el requisito de
       * que exista. Inventarla aqui haria que el cliente dependiera de una invencion.
       */
    },

    cancel() {
      if (posicionTimer !== undefined) clearInterval(posicionTimer);
      if (latidoTimer !== undefined) clearInterval(latidoTimer);
    },
  });

  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // Sin esto, un proxy bufferiza el stream y el latido deja de servir de nada.
      'X-Accel-Buffering': 'no',
    },
  });
}
