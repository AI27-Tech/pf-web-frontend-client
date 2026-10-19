/*
 * Conversacion de negocio, contra `bff`, que delega en `mensajeria`.
 *
 * Tres reglas del diseno que se ven desde aqui:
 *
 *   1. La secuencia que el front-end ordena es la DE DOMINIO, no el `seq` de
 *      transporte (P5). De ahi que `Mensaje` lleve `DomainSeq`.
 *
 *   2. El actor, el tenant y el rol se derivan del token, NUNCA del body. Por eso
 *      `enviarMensaje` solo manda el cuerpo: mandar un remitente seria a la vez
 *      inutil y una invitacion a suplantar.
 *
 *   3. Un recibo publico no filtra operacion (P23): sin pool member, sin claimant,
 *      sin supervisor, sin metadata de cola.
 *
 * Lo que esta app NO consume, y no por falta de tiempo: bandejas, cola, claim,
 * release, transfer y audit son de audiencia interna. Son de `panel-admin`.
 */

import { api } from './client';
import type { ConversacionResumen, Mensaje } from '../contracts';
import { orderByDomainSequence, toDomainSeq } from '../contracts';

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

/**
 * Envia un mensaje. `idempotencyKey` es del llamador para que un reintento de red
 * no duplique el mensaje.
 */
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

/** Cursor personal de lectura. */
export async function marcarLeido(conversacionId: string, hastaMensajeId: string): Promise<void> {
  await api.post<void>(`/conversaciones/${conversacionId}/receipts/lectura`, {
    hasta_mensaje_id: hastaMensajeId,
  });
}
