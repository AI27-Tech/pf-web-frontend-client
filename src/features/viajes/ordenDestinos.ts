/*
 * ordenDestinos — modelo y operaciones puras de los destinos intermedios de la solicitud.
 *
 * Vive aparte de `DestinosIntermedios.tsx` porque ese archivo solo debe exportar el
 * componente (recarga en caliente de Vite). Sin estado ni efectos, salvo el contador que
 * reparte identificadores.
 */

/** Un destino intermedio en edición. El `id` es estable aunque cambie su posición. */
export interface DestinoIntermedio {
  readonly id: string;
  readonly nombre: string;
  readonly numeroEnvio: string;
}

let secuencia = 0;

/** Destino intermedio vacío con un `id` propio (la clave de React no puede ser el índice). */
export function nuevoDestinoIntermedio(): DestinoIntermedio {
  secuencia += 1;
  return { id: `destino-intermedio-${secuencia}`, nombre: '', numeroEnvio: '' };
}

/** Copia de `lista` con el elemento de `desde` movido a `hasta`. Índices fuera de rango: sin cambio. */
export function moverElemento<T>(lista: readonly T[], desde: number, hasta: number): readonly T[] {
  const enRango = (i: number): boolean => Number.isInteger(i) && i >= 0 && i < lista.length;
  if (desde === hasta || !enRango(desde) || !enRango(hasta)) return lista;
  const copia = [...lista];
  const [movido] = copia.splice(desde, 1);
  if (movido === undefined) return lista;
  copia.splice(hasta, 0, movido);
  return copia;
}
