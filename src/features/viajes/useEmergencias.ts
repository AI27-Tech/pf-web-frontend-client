/*
 * Estado de servidor de las emergencias de un viaje (E9-T9, AI27-28).
 *
 * Este hook es el ÚNICO dueño del estado de servidor de la emergencia: la lista de
 * casos (vista cliente) y las dos mutaciones (activar, agregar nota). La `*Section`
 * que lo consume es presentacional.
 *
 * - `useQuery` trae la vista mínima (`EmergenciasCliente`) y la refresca con la MISMA
 *   cadencia de polling del seguimiento (ADR 27): no hay dependencia de SSE (el ticket
 *   y ADR 28 permiten operar por HTTP; la entrega viva es mejora, no requisito).
 * - Las mutaciones invalidan la clave de la lista al terminar, para que el nuevo caso
 *   o el estado tras la nota aparezcan sin un refetch manual.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activarEmergencia, agregarNotaEmergencia, listEmergencias } from '@/lib/api/emergencias';
import { VIAJE_POLLING_INTERVAL_MS } from '@/lib/constants';
import type { ActivarEmergenciaClienteEntrada } from '@/lib/contracts';

/** Clave de caché de la lista de emergencias de un viaje. Fuente única. */
export function emergenciasQueryKey(viajeId: string): readonly ['emergencias', string] {
  return ['emergencias', viajeId];
}

export function useEmergencias(viajeId: string) {
  const queryClient = useQueryClient();
  const queryKey = emergenciasQueryKey(viajeId);

  const consulta = useQuery({
    queryKey,
    queryFn: ({ signal }) => listEmergencias(viajeId, signal),
    refetchInterval: VIAJE_POLLING_INTERVAL_MS,
  });

  async function invalidar(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey });
  }

  /**
   * Activa una emergencia. Recibe el `activacion_id` ya generado por pulsación
   * intencional: la idempotencia la gobierna ese id (ver `lib/api/emergencias.ts`).
   */
  const activar = useMutation({
    mutationFn: (entrada: ActivarEmergenciaClienteEntrada) => activarEmergencia(viajeId, entrada),
    onSuccess: invalidar,
  });

  /** Agrega una nota a un caso. El cuerpo ya viene recortado y no vacío desde la UI. */
  const agregarNota = useMutation({
    mutationFn: ({ emergenciaId, cuerpo }: { emergenciaId: string; cuerpo: string }) =>
      agregarNotaEmergencia(viajeId, emergenciaId, { cuerpo }),
    onSuccess: invalidar,
  });

  return { consulta, activar, agregarNota };
}
