/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * Las DOS secuencias, y la razon por la que viven en tipos distintos.
 *
 * Es la fuente de error mas silenciosa del diseno (realtime, apartado (b) y §4.4):
 *
 *   - `TransportSeq` es el `seq` del sobre SSE. Alcance: por conexion.
 *     Lo asigna realtime al escribir al socket. Vive en una ventana transitoria
 *     en Redis. Su UNICO trabajo es reanudar via Last-Event-ID.
 *
 *   - `DomainSeq` es la secuencia de dominio. Alcance: por agregado (conversacion,
 *     viaje). La asigna el servicio dueno del agregado, dentro de su transaccion,
 *     comprometida en Postgres. Resuelve el orden canonico y la deteccion de huecos.
 *
 * Relacion entre las dos: NINGUNA. No se derivan, no se comparan, no se convierten.
 * Confundirlas produce mensajes bien ordenados en el cable y mal ordenados en la
 * pantalla — y eso es un bug que no se ve en desarrollo.
 *
 * Por eso aqui no existe —y no debe existir— ninguna funcion que convierta una en
 * otra, ni un tipo comun del que ambas deriven. La ausencia es el mecanismo (P5).
 *
 * NOTA (E9-T10 / F-06): la `DomainSeq` y el ordenado por secuencia de dominio son V1
 * —los usa la conversacion de negocio (mensajeria)—, asi que este modulo se queda en
 * `src/`. La `TransportSeq` y su `transportSeqToLastEventId` solo los consumia el
 * cliente SSE, que es V2 y quedo aislado en `prototipos-v2/seguimiento-vivo/`; se
 * conservan aqui porque documentan POR QUE existe la secuencia de dominio: son la
 * mitad de la invariante de las dos secuencias.
 */

declare const transportSeqBrand: unique symbol;
declare const domainSeqBrand: unique symbol;

/** `seq` del sobre SSE. Solo para reanudacion por Last-Event-ID. */
export type TransportSeq = number & { readonly [transportSeqBrand]: 'TransportSeq' };

/** Secuencia de dominio. Es la que ordena y deduplica en pantalla. */
export type DomainSeq = number & { readonly [domainSeqBrand]: 'DomainSeq' };

export function toTransportSeq(value: number): TransportSeq {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`TransportSeq invalido: ${value}`);
  }
  return value as TransportSeq;
}

export function toDomainSeq(value: number): DomainSeq {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`DomainSeq invalido: ${value}`);
  }
  return value as DomainSeq;
}

/** Serializa el `seq` de transporte para la cabecera Last-Event-ID. */
export function transportSeqToLastEventId(seq: TransportSeq): string {
  return String(seq);
}

/**
 * Ordena y deduplica por secuencia DE DOMINIO. Es la unica forma correcta de
 * ordenar lo que se muestra. Deduplica por identidad de dominio: ante la misma
 * identidad gana la secuencia mayor.
 */
export function orderByDomainSequence<T extends { readonly id: string; readonly seq: DomainSeq }>(
  items: readonly T[],
): readonly T[] {
  const latestById = new Map<string, T>();

  for (const item of items) {
    const existing = latestById.get(item.id);
    if (existing === undefined || item.seq > existing.seq) {
      latestById.set(item.id, item);
    }
  }

  return [...latestById.values()].sort((a, b) => a.seq - b.seq);
}

/**
 * Detecta huecos en una secuencia de dominio ya ordenada. Un hueco NO se cierra
 * con el stream: se cierra por lectura HTTP durable contra el dueno del agregado.
 */
export function findDomainSequenceGaps(ordered: readonly { readonly seq: DomainSeq }[]): number[] {
  const gaps: number[] = [];

  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    if (previous === undefined || current === undefined) continue;

    for (let missing = previous.seq + 1; missing < current.seq; missing += 1) {
      gaps.push(missing);
    }
  }

  return gaps;
}
