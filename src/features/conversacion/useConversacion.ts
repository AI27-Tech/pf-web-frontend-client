/*
 * Estado de servidor de la conversación de un viaje (E9-T8 / E3-HU-014, AI27-27).
 *
 * Este hook es el ÚNICO dueño del estado de servidor de la conversación: la metadata
 * (estado de ciclo de vida + indicador `atendida`), la historia de mensajes y la
 * mutación de envío. La `*Section` que lo consume es presentacional.
 *
 * Transporte V1 (sin SSE): la lectura es `useQuery` + polling, con la MISMA cadencia del
 * seguimiento del viaje (ADR 27). La entrega viva por stream es mejora posterior, no
 * requisito V1. El catch-up tras cada poll usa `despues_de` sobre la secuencia de dominio
 * más alta que ya tenemos, de modo que cada vuelta trae SOLO lo nuevo y la lista crece
 * sin recargar toda la historia ni perder el orden.
 *
 * Envío idempotente: el `client_message_id` se genera POR INTENTO (al enviar), no por
 * render. Un reintento técnico de la MISMA mutación reusa ese id → el servidor devuelve
 * el mensaje original y no se duplica; un envío nuevo genera otro id → otro mensaje. El
 * mensaje confirmado se fusiona en la caché por secuencia de dominio (dedup incluido), y
 * el polling lo confirmará de todos modos en la siguiente vuelta.
 */

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  enviarMensajeViaje,
  listarMensajesViaje,
  obtenerConversacionViaje,
  type MensajeVista,
} from '@/lib/api/conversacion';
import { VIAJE_POLLING_INTERVAL_MS } from '@/lib/constants';
import { orderByDomainSequence } from '@/lib/contracts';

/** Clave de caché de la metadata de la conversación de un viaje. Fuente única. */
export function conversacionQueryKey(viajeId: string): readonly ['conversacion', string] {
  return ['conversacion', viajeId];
}

/** Clave de caché de la historia de mensajes de un viaje. Fuente única. */
export function mensajesQueryKey(viajeId: string): readonly ['conversacion-mensajes', string] {
  return ['conversacion-mensajes', viajeId];
}

/** Secuencia de dominio más alta de una lista YA ordenada (la del último mensaje). */
function ultimaSecuencia(mensajes: readonly MensajeVista[]): number | undefined {
  const ultimo = mensajes.at(-1);
  return ultimo?.seq;
}

export function useConversacion(viajeId: string) {
  const queryClient = useQueryClient();
  const mensajesKey = mensajesQueryKey(viajeId);

  const conversacion = useQuery({
    queryKey: conversacionQueryKey(viajeId),
    queryFn: ({ signal }) => obtenerConversacionViaje(viajeId, signal),
    refetchInterval: VIAJE_POLLING_INTERVAL_MS,
  });

  /*
   * La historia vive en una sola clave y se acumula entre polls. La `queryFn`:
   *   - primera vez (caché vacía): trae los más recientes (sin `antes_de`/`despues_de`);
   *   - polls siguientes: `despues_de` la última secuencia que ya tenemos (catch-up),
   *     fusionando lo nuevo con lo acumulado y deduplicando por secuencia de dominio.
   * El `hay_mas` de esta llamada no se expone aquí: la paginación HACIA ATRÁS (historia
   * antigua) la pide la UI con `cargarMasAntiguos`, que escribe en esta misma caché.
   */
  const mensajes = useQuery({
    queryKey: mensajesKey,
    queryFn: async ({ signal }) => {
      const previos = queryClient.getQueryData<readonly MensajeVista[]>(mensajesKey) ?? [];
      const desde = ultimaSecuencia(previos);
      const pagina = await listarMensajesViaje(
        viajeId,
        desde !== undefined ? { despuesDe: desde } : {},
        signal,
      );
      // Fusiona lo acumulado con lo nuevo; `orderByDomainSequence` ordena y deduplica.
      return orderByDomainSequence([...previos, ...pagina.items]);
    },
    refetchInterval: VIAJE_POLLING_INTERVAL_MS,
  });

  /**
   * Trae una página de historia MÁS ANTIGUA (hacia atrás) con `antes_de` la secuencia
   * más baja que ya tenemos, y la fusiona en la misma caché. Devuelve si quedaba más
   * historia por traer (`hay_mas`), para que la UI muestre u oculte el botón.
   */
  const cargarMasAntiguos = useCallback(async (): Promise<boolean> => {
    const previos = queryClient.getQueryData<readonly MensajeVista[]>(mensajesKey) ?? [];
    const masAntiguo = previos.at(0)?.seq;
    const pagina = await listarMensajesViaje(
      viajeId,
      masAntiguo !== undefined ? { antesDe: masAntiguo } : {},
    );
    queryClient.setQueryData<readonly MensajeVista[]>(mensajesKey, (actuales) =>
      orderByDomainSequence([...pagina.items, ...(actuales ?? [])]),
    );
    return pagina.hayMas;
  }, [queryClient, mensajesKey, viajeId]);

  const enviar = useMutation({
    /*
     * `client_message_id` POR INTENTO: lo genera la mutación, no el componente. Un
     * reintento de ESTA misma mutación (p. ej. la red falló y Query reintenta) reusa el
     * mismo id → no duplica; un envío nuevo entra aquí otra vez y genera otro.
     */
    mutationFn: (cuerpo: string) =>
      enviarMensajeViaje(viajeId, { cuerpo, clientMessageId: crypto.randomUUID() }),
    onSuccess: (mensaje) => {
      // El mensaje confirmado se fusiona en la caché por secuencia (dedup incluido): si
      // el polling ya lo trajo, `orderByDomainSequence` no lo duplica.
      queryClient.setQueryData<readonly MensajeVista[]>(mensajesKey, (actuales) =>
        orderByDomainSequence([...(actuales ?? []), mensaje]),
      );
    },
  });

  // La conversación admite escritura solo si su estado es `abierta`. `solo_lectura` y
  // `cerrada` deshabilitan el envío en la UI; el servidor lo confirma con 409 si llega.
  const puedeEscribir = conversacion.data?.estado === 'abierta';

  return useMemo(
    () => ({ conversacion, mensajes, enviar, cargarMasAntiguos, puedeEscribir }),
    [conversacion, mensajes, enviar, cargarMasAntiguos, puedeEscribir],
  );
}
