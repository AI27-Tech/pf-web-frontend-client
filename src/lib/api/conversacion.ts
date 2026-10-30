/*
 * Conversación del viaje, contra `bff` (E9-T8 / E3-HU-014, AI27-27). Carril de
 * audiencia Cliente.
 *
 * El `bff` (contrato `tracer.26+`) monta las tres rutas de la conversación ANCLADAS AL
 * VIAJE - el cliente navega por viaje y la conversación la resuelve el servidor - y las
 * proyecta a la vista mínima del cliente
 *
 * Idempotencia del envío: la lleva el CUERPO (`client_message_id`), no un header. El
 * contrato pide `EnviarMensajeClienteEntrada.client_message_id`, una clave que genera el
 * cliente por intento. Un reintento del MISMO id devuelve el mensaje original (200); un
 * intento nuevo (otro id) crea otro mensaje (201).
 *
 * Paginación POR SECUENCIA de dominio, no por cursor opaco: `antes_de` lee la historia
 * hacia atrás y `despues_de` recupera lo nuevo tras reconectar (catch-up). Son
 * mutuamente excluyentes; sin ninguno, el `bff` devuelve los más recientes.
 */

import { api } from './client';
import { orderByDomainSequence, toDomainSeq, type DomainSeq } from '@/lib/contracts';
import type {
  ConversacionCliente,
  EnviarMensajeClienteEntrada,
  MensajeCliente,
  PaginaMensajesCliente,
} from '@/lib/contracts';

/**
 * Mensaje en forma de VISTA: la `secuencia` int64 del contrato se marca como
 * `DomainSeq` para que el ordenado y la deduplicación de dominio (`orderByDomainSequence`)
 * no se puedan confundir con ningún otro número (la secuencia de transporte de SSE).
 * Es la única transformación: el resto de campos es el del contrato tal cual.
 */
export interface MensajeVista {
  readonly id: string;
  /** Secuencia DE DOMINIO: es la que ordena y deduplica en pantalla. */
  readonly seq: DomainSeq;
  readonly cuerpo: string;
  readonly enviadoEn: string;
  /** true si lo escribió el cliente; false si lo escribió AI27 ("AI27 Operations"). */
  readonly deCliente: boolean;
}

/** Una página de la historia, ya ordenada y deduplicada por secuencia de dominio. */
export interface PaginaMensajesVista {
  readonly items: readonly MensajeVista[];
  /** true si hay más mensajes en la dirección pedida (`antes_de`/`despues_de`). */
  readonly hayMas: boolean;
}

/** Filtro de la historia. `antes_de` y `despues_de` son MUTUAMENTE EXCLUYENTES. */
export interface ListarMensajesFiltro {
  /** Lee hacia atrás: mensajes con secuencia menor a este valor (historia). */
  readonly antesDe?: number;
  /** Lee hacia adelante: mensajes con secuencia mayor a este valor (catch-up). */
  readonly despuesDe?: number;
  /** Tope de la página (1..200; el servidor usa 50 por defecto). */
  readonly limite?: number;
}

function toMensajeVista(wire: MensajeCliente): MensajeVista {
  return {
    id: wire.id,
    seq: toDomainSeq(wire.secuencia),
    cuerpo: wire.cuerpo,
    enviadoEn: wire.enviado_en,
    deCliente: wire.de_cliente,
  };
}

/**
 * Lee la conversación del viaje (estado de ciclo de vida + indicador `atendida`). Vista
 * mínima del cliente: sin `conversacion_id`, bandeja, reclamo ni actor interno.
 */
export async function obtenerConversacionViaje(
  viajeId: string,
  signal?: AbortSignal,
): Promise<ConversacionCliente> {
  return api.get<ConversacionCliente>(
    `/viajes/${viajeId}/conversacion`,
    signal !== undefined ? { signal } : {},
  );
}

/**
 * Lee una página de la historia por secuencia de dominio. `antesDe`/`despuesDe` son
 * excluyentes (si llegan los dos, gana `antesDe` y se ignora `despuesDe`, como pide el
 * contrato de parámetros mutuamente excluyentes). La página vuelve YA ordenada y
 * deduplicada por secuencia: `hayMas` indica si queda más en la dirección pedida.
 */
export async function listarMensajesViaje(
  viajeId: string,
  filtro: ListarMensajesFiltro = {},
  signal?: AbortSignal,
): Promise<PaginaMensajesVista> {
  // Mutuamente excluyentes: `antes_de` manda si vienen ambos; nunca se mandan juntos.
  const query: Record<string, number> = {};
  if (filtro.antesDe !== undefined) query.antes_de = filtro.antesDe;
  else if (filtro.despuesDe !== undefined) query.despues_de = filtro.despuesDe;
  if (filtro.limite !== undefined) query.limite = filtro.limite;

  const pagina = await api.get<PaginaMensajesCliente>(`/viajes/${viajeId}/conversacion/mensajes`, {
    ...(Object.keys(query).length > 0 ? { query } : {}),
    ...(signal !== undefined ? { signal } : {}),
  });

  return {
    items: orderByDomainSequence(pagina.items.map(toMensajeVista)),
    hayMas: pagina.hay_mas,
  };
}

/**
 * Envía un mensaje del cliente a la conversación del viaje. Idempotente por
 * `clientMessageId` del CUERPO: reintentar el mismo id devuelve el mensaje original (200);
 * un id nuevo crea otro (201). El `bff` devuelve el `MensajeCliente` resultante en ambos
 * casos, así que el wrapper no distingue 200 de 201: el llamante recibe el mensaje vigente.
 * El `409 conversacion_solo_lectura` (ventana de escritura vencida, DEC-030/DEC-041) se
 * propaga como `ApiError` para que la UI lo explique.
 */
export async function enviarMensajeViaje(
  viajeId: string,
  entrada: { readonly cuerpo: string; readonly clientMessageId: string },
): Promise<MensajeVista> {
  const cuerpo: EnviarMensajeClienteEntrada = {
    cuerpo: entrada.cuerpo,
    client_message_id: entrada.clientMessageId,
  };
  const wire = await api.post<MensajeCliente>(`/viajes/${viajeId}/conversacion/mensajes`, cuerpo);
  return toMensajeVista(wire);
}
