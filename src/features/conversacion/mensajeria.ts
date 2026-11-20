/*
 * mensajeria: puente entre la vista del cliente (`MensajeVista`, forma del contrato `bff`
 * `MensajeCliente`) y los tipos de `MessagePanel` de `@ai27-tech/ui`.
 *
 * La librería no importa el contrato: el consumidor convierte el JSON a su tipo `Mensaje`
 * (README de la librería, "Mensajería"). Esta es esa conversión, en un solo lugar.
 *
 * Lo que el contrato del CLIENTE no trae, y cómo se resuelve sin inventar wire:
 *   - `conversacionId`: el cliente nunca lo ve (la conversación se ancla al VIAJE). Se usa
 *     el id del viaje como identificador local; no viaja a ningún lado.
 *   - `clientMessageId`: `MensajeCliente` no lo devuelve. Se usa el `id` del mensaje, que es
 *     único. La deduplicación de envíos pendientes no depende de él (ver `ConversacionPanel`).
 *   - autor real y rol: nunca llegan (DEC-021); la audiencia es solo Cliente o Interno.
 */

import type { EstadoConversacion, Mensaje } from '@ai27-tech/ui';
import type { MensajeVista } from '@/lib/api/conversacion';

/** Etiqueta constante con la que AI27 se presenta al cliente (DEC-021 #4). */
export const ETIQUETA_AI27 = 'AI27 Operations';

/** Convierte un mensaje del cliente al tipo `Mensaje` de la librería. */
export function aMensajeLibreria(mensaje: MensajeVista, viajeId: string): Mensaje {
  return {
    id: mensaje.id,
    conversacionId: viajeId,
    secuencia: mensaje.seq,
    clientMessageId: mensaje.id,
    audienciaAutor: mensaje.deCliente ? 'Cliente' : 'Interno',
    aliasMostrado: mensaje.deCliente ? 'Tú' : ETIQUETA_AI27,
    cuerpo: mensaje.cuerpo,
    creadoEn: mensaje.enviadoEn,
  };
}

export function esMensajePropio(mensaje: Mensaje): boolean {
  return mensaje.audienciaAutor === 'Cliente';
}

export function razonSoloLectura(estado: EstadoConversacion): string | null {
  switch (estado) {
    case 'abierta':
      return null;
    case 'solo_lectura':
      return 'Esta conversación es de solo lectura: la ventana para escribir se cerró.';
    case 'cerrada':
      return 'Esta conversación está cerrada.';
  }
}
