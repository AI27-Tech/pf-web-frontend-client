/*
 * Seguimiento del viaje con polling HTTP (E9-T5 / AI27-24, ADR 27).
 *
 * ADR 27: en V1 el seguimiento del cliente (hito + ETA estimado + incidencias curadas)
 * se transporta por pull inicial + polling periodico contra `bff`. No hay SSE para
 * hitos en V1 (eso es seguimiento vivo V2). Este hook es el UNICO dueno del estado de
 * servidor del detalle del viaje: la `*Section` que lo consume es presentacional.
 *
 * Por que `useQuery` y no un re-fetch a mano:
 *   - `refetchInterval` da el polling mientras la ruta de detalle este montada, y lo
 *     detiene solo al desmontar (al salir de la vista). Ese es el comportamiento que
 *     pide ADR 27 §1, sin un `setInterval` propio que limpiar.
 *   - Un refetch de fondo que falla NO reemplaza el ultimo dato bueno: TanStack Query
 *     conserva `data` y expone el fallo aparte en `error`/`isError`. La pantalla ya
 *     cargada no se cae por un tropiezo del polling.
 *   - `refetchIntervalInBackground` queda en su valor por defecto (false): si la
 *     pestana no esta visible, el poll de fondo se detiene y se reanuda al volver.
 *     No gastamos lecturas de `bff → operacion` contra una pestana que nadie mira.
 *
 * La clave `['viaje', viajeId]` la comparte el `initialData` que la ruta siembra desde
 * su `loader` (ver la ruta): el primer render no parpadea y el `loader` sigue siendo la
 * puerta del PRIMER fallo de carga (lo cubre el `errorComponent` de la ruta).
 */

import { useQuery } from '@tanstack/react-query';
import { getViaje } from '@/lib/api/viajes';
import { VIAJE_POLLING_INTERVAL_MS } from '@/lib/constants';
import type { ViajeSeguimiento } from '@/lib/contracts';

/** Clave de cache del seguimiento de un viaje. Fuente unica para ruta y componente. */
export function viajeQueryKey(viajeId: string): readonly ['viaje', string] {
  return ['viaje', viajeId];
}

/**
 * Suscribe el detalle del viaje al polling de ADR 27. `initialData` es el dato que la
 * ruta ya trajo en su `loader`; `initialDataUpdatedAt` le dice a Query cuando se
 * observo, para que el primer poll respete el `staleTime` global en vez de disparar de
 * inmediato.
 */
export function useViajeSeguimiento(viajeId: string, initialData: ViajeSeguimiento) {
  return useQuery({
    queryKey: viajeQueryKey(viajeId),
    queryFn: ({ signal }) => getViaje(viajeId, signal),
    initialData,
    initialDataUpdatedAt: () => Date.now(),
    refetchInterval: VIAJE_POLLING_INTERVAL_MS,
  });
}
