/*
 * El hook donde converge todo: las dos rutas de datos, un solo parser, un solo tipo.
 *
 * Lo que hace, en orden:
 *
 *   1. Carga inicial por la RUTA PULL (`GET /viajes/{id}/tracking` en bff).
 *   2. Abre el stream contra `realtime` y, por cada sobre, pasa el payload por EL
 *      MISMO parser y lo escribe en la cache de la query. La pantalla no sabe —ni
 *      necesita saber— por que ruta llego el ultimo dato.
 *   3. Si el stream no entrega, hace polling contra la ruta pull. Mismo parser, mismo
 *      contrato, misma cache: no hay ruta de codigo alterna.
 *
 * El detalle que mas importa esta en `mergeByDomainSequence`: un sobre que llega
 * tarde NO retrocede el estado. Y la comparacion se hace con la secuencia DE DOMINIO,
 * nunca con el `seq` del sobre (P5) — que en este archivo no se toca para nada mas
 * que reanudar, dentro del cliente del stream.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POLLING_INTERVAL_MS, STREAM_ENABLED } from '@/lib/constants';
import { getSeguimiento } from '@/lib/api/viajes';
import { parseSeguimientoPayload } from '@/lib/seguimiento/parseSeguimientoPayload';
import { openStream } from '@/lib/stream/streamClient';
import { canalViaje, type Sobre, type SeguimientoPayload } from '@/lib/contracts';
import { useDegradation } from '@/context/DegradationContext';

/** Tipos de sobre que transportan un payload de seguimiento. */
const TIPOS_DE_SEGUIMIENTO: ReadonlySet<Sobre['tipo']> = new Set([
  'posicion.actualizada',
  'eta.actualizado',
  'geocerca.evento',
  'viaje.estado_cambiado',
  'sin_senal.detectado',
]);

/** La clave de cache, en un solo sitio para que pull y push escriban en la misma. */
function seguimientoQueryKey(viajeId: string): readonly [string, string] {
  return ['seguimiento', viajeId];
}

/**
 * Un sobre reordenado por la red no debe retroceder la pantalla. Gana la secuencia
 * de dominio mayor — no la que llego mas tarde, y no el `seq` de transporte mayor.
 */
function mergeByDomainSequence(
  previous: SeguimientoPayload | undefined,
  incoming: SeguimientoPayload,
): SeguimientoPayload {
  if (previous === undefined) return incoming;
  return incoming.secuenciaDominio >= previous.secuenciaDominio ? incoming : previous;
}

export function useSeguimiento(viajeId: string) {
  const { mode, reportStreamStatus } = useDegradation();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: seguimientoQueryKey(viajeId),
    queryFn: ({ signal }) => getSeguimiento(viajeId, signal),
    /*
     * Polling solo cuando el push no esta entregando. La carga de push se convierte
     * en carga de pull sobre bff, asi que esta cadencia no es gratis.
     */
    refetchInterval: mode === 'polling' ? POLLING_INTERVAL_MS : false,
  });

  useEffect(() => {
    // Sin stream configurado, la app corre pull-only. Ver ADR 10.
    if (!STREAM_ENABLED) return;

    const handle = openStream([canalViaje(viajeId)], {
      onStatus: reportStreamStatus,

      onSobre: (sobre) => {
        if (!TIPOS_DE_SEGUIMIENTO.has(sobre.tipo)) return;

        try {
          // EL MISMO parser que usa la ruta pull. Ahi esta P4.
          const payload = parseSeguimientoPayload(sobre.payload);
          queryClient.setQueryData<SeguimientoPayload>(seguimientoQueryKey(viajeId), (previous) =>
            mergeByDomainSequence(previous, payload),
          );
        } catch {
          /*
           * Un sobre ilegible se descarta: la ruta durable cerrara el hueco. Lo que
           * NO se hace es rellenar con el ultimo valor conocido como si fuera nuevo.
           */
          // TODO(observabilidad): contar sobres descartados por parseo.
        }
      },
    });

    return () => handle.close();
  }, [viajeId, queryClient, reportStreamStatus]);

  return query;
}
