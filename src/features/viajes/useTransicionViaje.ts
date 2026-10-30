/*
 * Mutación de cancelar/rechazar un viaje por el cliente (E1-HU-002 / E9-T7, AI27-26).
 *
 * Este hook es el dueño del lado de ESCRITURA del detalle del viaje: la transición de
 * estado que el cliente puede pedir. La lectura/seguimiento sigue siendo de
 * `useViajeSeguimiento` (polling de ADR 27); este hook solo escribe y REUSA la misma
 * clave de caché `['viaje', viajeId]` para refrescar la vista.
 *
 * Por qué siembra la caché y no invalida:
 *   - El contrato `transicionarViajeCliente` responde `200` con el `ViajeSeguimiento`
 *     YA actualizado: es la misma forma que devuelve `getViaje`. Esa respuesta es el
 *     dato bueno, así que se escribe directo en `['viaje', viajeId]` con `setQueryData`.
 *     Un segundo GET sería redundante (y gastaría una lectura de `bff → operacion`).
 *   - Tras sembrar, el polling de `useViajeSeguimiento` sigue su cadencia normal: la
 *     próxima lectura confirmará el estado. No se fuerza un refetch inmediato.
 *
 * `causa` (el motivo) es OBLIGATORIA en ambas acciones (DEC-111). La guarda está en la
 * UI (el botón de confirmar se deshabilita con el motivo vacío); el wrapper la manda
 * siempre, y si llegara vacía el servidor responde `400` —que esta mutación propaga
 * como error para que la UI lo muestre.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transicionarViajeCliente, type EstadoDestinoCliente } from '@/lib/api/viajes';
import type { ViajeSeguimiento } from '@/lib/contracts';
import { viajeQueryKey } from './useViajeSeguimiento';

export interface TransicionClienteVariables {
  readonly aEstado: EstadoDestinoCliente;
  readonly causa: string;
}

export function useTransicionViaje(viajeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ aEstado, causa }: TransicionClienteVariables) =>
      transicionarViajeCliente(viajeId, aEstado, causa),
    onSuccess: (seguimiento: ViajeSeguimiento) => {
      // El `200` trae el viaje ya actualizado: se escribe en la caché del seguimiento
      // SIN un segundo GET. El polling de ADR 27 seguirá confirmando después.
      queryClient.setQueryData(viajeQueryKey(viajeId), seguimiento);
    },
  });
}
