/*
 * Cliente SSE contra `realtime`.
 *
 * Va DIRECTO a realtime, no a traves de bff: bff no proxea el stream, y por eso
 * hay dos base URLs en el entorno. Ese es tambien el motivo de que una caida de
 * bff no apague el seguimiento vivo de las sesiones ya conectadas.
 *
 * Las cuatro reglas del protocolo que este modulo implementa:
 *
 *   1. `seq` SOLO para reanudar. Se manda en Last-Event-ID y no se compara con
 *      ninguna secuencia de dominio (P5).
 *   2. Latido cada 4 s; a los 7 s sin latido ni mensaje, la conexion se considera
 *      muerta y se reconecta con el ultimo `seq` efectivamente recibido. La
 *      deteccion de liveness es del cliente porque TCP mantiene abierta una
 *      conexion muerta durante minutos.
 *   3. El servidor lleva la contabilidad: prioridad, TTL y dedup de ventana ya
 *      vienen aplicados. El cliente NO reordena ni revalida.
 *   4. Vivo pero silencioso es un modo de falla: latido sin datos, porque el broker
 *      esta caido. Ante la senal del servidor, degradar a polling.
 *
 * Por que no `EventSource`: no permite cabeceras, asi que no se puede mandar
 * `Authorization`, y su reconexion automatica no es la nuestra. Se usa fetch con
 * streaming, que si deja controlar ambas cosas.
 */

import { STREAM_BASE_URL, STREAM_TIMINGS } from '../constants';
import { API_PREFIX } from '../constants';
import { backoffWithJitter } from '../utils';
import { tokenStore } from '../api/tokenStore';
import type { Canal, Sobre, TransportSeq } from '../contracts';
import { canalesToQuery, toTransportSeq, transportSeqToLastEventId } from '../contracts';

export type StreamStatus =
  | 'inactivo'
  | 'conectando'
  | 'abierto'
  /** Conectado y latiendo, pero el servidor avisa que no esta recibiendo. */
  | 'vivo-sin-datos'
  /** Se perdio el liveness o la conexion: se esta reintentando. */
  | 'reconectando'
  /** Se agoto el camino del push. Quien escucha debe pasar a polling. */
  | 'caido';

export interface StreamHandlers {
  onSobre(sobre: Sobre): void;
  onStatus(status: StreamStatus): void;
}

export interface StreamHandle {
  close(): void;
}

interface ParsedSseEvent {
  readonly id: string | null;
  readonly data: string;
}

/** Parsea un bloque de evento SSE ya delimitado por linea en blanco. */
function parseSseBlock(block: string): ParsedSseEvent | null {
  let id: string | null = null;
  const dataLines: string[] = [];

  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue; // comentario: es el latido de 1 byte
    if (line.startsWith('id:')) id = line.slice(3).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }

  if (dataLines.length === 0) return null;
  return { id, data: dataLines.join('\n') };
}

function toSobre(data: string): Sobre | null {
  const parsed: unknown = JSON.parse(data);
  if (typeof parsed !== 'object' || parsed === null) return null;

  const record = parsed as Record<string, unknown>;
  if (typeof record['seq'] !== 'number' || typeof record['tipo'] !== 'string') return null;

  return {
    seq: toTransportSeq(record['seq']),
    tipo: record['tipo'] as Sobre['tipo'],
    prioridad: (record['prioridad'] as Sobre['prioridad']) ?? 'baja',
    ttlSeg: typeof record['ttl_seg'] === 'number' ? record['ttl_seg'] : null,
    dedupKey: typeof record['dedup_key'] === 'string' ? record['dedup_key'] : null,
    ts: typeof record['ts'] === 'string' ? record['ts'] : new Date().toISOString(),
    payload: record['payload'],
  };
}

/**
 * Abre el stream para un conjunto CERRADO de canales.
 *
 * `canales` es `Canal[]`, no `string[]`, y `Canal` solo se construye con las
 * funciones de `contracts/canales.ts`. Es asi a proposito: el navegador no
 * selecciona canales arbitrarios de usuario, pool o bandeja.
 */
export function openStream(canales: readonly Canal[], handlers: StreamHandlers): StreamHandle {
  const controller = new AbortController();
  let lastSeq: TransportSeq | null = null;
  let attempt = 0;
  let closed = false;
  let livenessTimer: ReturnType<typeof setTimeout> | undefined;

  const setStatus = (status: StreamStatus): void => {
    if (!closed) handlers.onStatus(status);
  };

  /*
   * Regla 2: cualquier trafico —mensaje o latido— rearma el temporizador. Si
   * expira, la conexion esta muerta aunque TCP crea lo contrario.
   */
  const armLiveness = (onDead: () => void): void => {
    if (livenessTimer !== undefined) clearTimeout(livenessTimer);
    livenessTimer = setTimeout(onDead, STREAM_TIMINGS.livenessTimeoutMs);
  };

  const clearLiveness = (): void => {
    if (livenessTimer !== undefined) clearTimeout(livenessTimer);
    livenessTimer = undefined;
  };

  async function connectOnce(): Promise<void> {
    const url = new URL(`${API_PREFIX}/stream`, STREAM_BASE_URL);
    url.searchParams.set('canales', canalesToQuery(canales));

    const headers = new Headers({
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    });

    const token = tokenStore.getAccessToken();
    if (token !== null) headers.set('Authorization', `Bearer ${token}`);

    // Regla 1: el unico uso del seq de transporte.
    if (lastSeq !== null) headers.set('Last-Event-ID', transportSeqToLastEventId(lastSeq));

    setStatus('conectando');

    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok || response.body === null) {
      throw new Error(`El stream respondio ${response.status}`);
    }

    setStatus('abierto');
    attempt = 0;

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';

    const abortReader = (): void => {
      void reader.cancel();
    };
    armLiveness(abortReader);

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      // Trafico recibido: rearma liveness. Un latido cuenta, aunque no traiga datos.
      armLiveness(abortReader);
      buffer += value;

      let separator = buffer.indexOf('\n\n');
      while (separator !== -1) {
        const block = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);

        const event = parseSseBlock(block);
        if (event !== null) {
          try {
            const sobre = toSobre(event.data);
            if (sobre !== null) {
              lastSeq = sobre.seq;
              handlers.onSobre(sobre);
              setStatus('abierto');
            } else {
              /*
               * Regla 4: el servidor avisa de que esta vivo pero no recibe. La
               * forma exacta de esta senal esta pendiente de contrato — ver
               * SenalIngestaDegradada en contracts/envelope.ts.
               */
              // TODO(contracts): reconocer la senal real de ingesta degradada.
              setStatus('vivo-sin-datos');
            }
          } catch {
            // Un sobre ilegible no tumba el stream: se descarta y se sigue.
            // TODO(observabilidad): contar sobres descartados por parseo.
          }
        }

        separator = buffer.indexOf('\n\n');
      }
    }

    clearLiveness();
    throw new Error('El stream se cerro');
  }

  async function loop(): Promise<void> {
    while (!closed) {
      try {
        await connectOnce();
      } catch {
        clearLiveness();
        if (closed) return;

        attempt += 1;
        setStatus('reconectando');

        /*
         * Tras varios intentos se declara caido para que la capa de degradacion
         * pase a polling contra la ruta pull de bff. No se reintenta en silencio
         * para siempre: eso deja al usuario mirando datos viejos sin saberlo.
         */
        if (attempt >= 4) setStatus('caido');

        const delay = backoffWithJitter(
          attempt,
          STREAM_TIMINGS.reconnectBaseMs,
          STREAM_TIMINGS.reconnectMaxMs,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  void loop();

  return {
    close: () => {
      closed = true;
      clearLiveness();
      controller.abort();
      handlers.onStatus('inactivo');
    },
  };
}
