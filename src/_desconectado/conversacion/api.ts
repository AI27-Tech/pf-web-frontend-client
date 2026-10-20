/*
 * Conversación de negocio — DESCONECTADO (recorte al contrato, E8-T3).
 *
 * El `bff` (único contrato que el portal cliente consume) NO expone conversación ni
 * mensajes: esa superficie vive en `mensajeria.yaml`, que es de audiencia INTERNA
 * (bandeja compartida atendida por un pool), cuya cabecera dice "Lo consume bff,
 * nunca...". El cliente no tiene operación de conversación en su contrato, así que la
 * superficie se desconectó del enrutado y del barrel, conservándola aquí.
 *
 * Por eso `ConversacionResumen` y `Mensaje` son tipos LOCALES. `DomainSeq` y los
 * helpers de orden sí se conservan en el barrel (son utilidades de UI, no tipos de
 * wire), así que se siguen importando de ahí.
 *
 * Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import { api } from '@/lib/api/client';
import { orderByDomainSequence, toDomainSeq, type DomainSeq } from '@/lib/contracts';

/** Resumen de conversación para la lista. Tipo LOCAL provisional (fuera del contrato). */
export interface ConversacionResumen {
  readonly id: string;
  readonly asunto: string;
  readonly viajeId: string | null;
  readonly ultimoMensajeEn: string | null;
  readonly noLeidos: number;
}

/** Mensaje de la conversación. Tipo LOCAL provisional (fuera del contrato). */
export interface Mensaje {
  readonly id: string;
  /** Secuencia DE DOMINIO: es la que ordena en pantalla. */
  readonly seq: DomainSeq;
  readonly cuerpo: string;
  readonly enviadoEn: string;
  readonly deCliente: boolean;
}

interface MensajeWire {
  readonly id: string;
  readonly seq: number;
  readonly cuerpo: string;
  readonly enviado_en: string;
  readonly de_cliente: boolean;
}

function toMensaje(wire: MensajeWire): Mensaje {
  return {
    id: wire.id,
    seq: toDomainSeq(wire.seq),
    cuerpo: wire.cuerpo,
    enviadoEn: wire.enviado_en,
    deCliente: wire.de_cliente,
  };
}

export async function listConversaciones(
  signal?: AbortSignal,
): Promise<readonly ConversacionResumen[]> {
  return api.get<readonly ConversacionResumen[]>(
    '/conversaciones',
    signal !== undefined ? { signal } : {},
  );
}

/** Historia por secuencia de dominio, ya ordenada y deduplicada. */
export async function listMensajes(
  conversacionId: string,
  signal?: AbortSignal,
): Promise<readonly Mensaje[]> {
  const wire = await api.get<readonly MensajeWire[]>(
    `/conversaciones/${conversacionId}/mensajes`,
    signal !== undefined ? { signal } : {},
  );
  return orderByDomainSequence(wire.map(toMensaje));
}

export async function enviarMensaje(
  conversacionId: string,
  cuerpo: string,
  idempotencyKey: string,
): Promise<Mensaje> {
  const wire = await api.post<MensajeWire>(
    `/conversaciones/${conversacionId}/mensajes`,
    { cuerpo },
    { idempotencyKey },
  );
  return toMensaje(wire);
}

export async function marcarLeido(conversacionId: string, hastaMensajeId: string): Promise<void> {
  await api.post<void>(`/conversaciones/${conversacionId}/receipts/lectura`, {
    hasta_mensaje_id: hastaMensajeId,
  });
}
