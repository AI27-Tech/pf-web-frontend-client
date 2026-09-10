/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * Canales del stream, y por que son un tipo cerrado.
 *
 * Dos reglas del diseno convergen aqui (realtime, apartado (h) · P10):
 *
 *   1. "El navegador no selecciona canales de usuario, pool o bandeja arbitrarios."
 *   2. "El filtrado ocurre antes de publicar al canal, nunca en el navegador."
 *
 * La forma de cumplir la primera en TypeScript es no ofrecer un constructor libre.
 * `Canal` esta marcado, y los unicos constructores que existen son los de audiencia
 * cliente. No hay `asCanal(s: string)`, y no debe haberlo: si hace falta un canal
 * nuevo, se anade una funcion aqui y se revisa en ese commit.
 *
 * Ausencia deliberada: NO existe `canalFlota()`. `tenant:{t}:flota` es de audiencia
 * Interno, y esta app corre bajo Audiencia: Cliente. Un cliente nunca ve la flota.
 */

declare const canalBrand: unique symbol;

export type Canal = string & { readonly [canalBrand]: 'Canal' };

/** Canal de seguimiento de un viaje concreto. */
export function canalViaje(viajeId: string): Canal {
  return `viaje:${viajeId}` as Canal;
}

/** Canal de una conversacion de negocio del sujeto autenticado. */
export function canalConversacion(conversacionId: string): Canal {
  return `conversacion:${conversacionId}` as Canal;
}

/** Serializa canales para el parametro `canales` de GET /api/v1/stream. */
export function canalesToQuery(canales: readonly Canal[]): string {
  return canales.join(',');
}
