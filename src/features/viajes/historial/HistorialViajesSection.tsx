/*
 * HistorialViajesSection: la `*Section` del Historial de Viajes.
 *
 * Presentacional: recibe los viajes por props y NO llama a la API. El fetch lo hace el
 * `loader` de la ruta, que es la frontera. Aqui solo hay composicion: encabezado y el
 * listado (filtros, tabla y paginacion).
 *
 */

import type { EstadoViaje, ViajeResumen } from '@/lib/contracts';
import { HistorialHeader } from './HistorialHeader';
import { HistorialViajesTable } from './HistorialViajesTable';

export function HistorialViajesSection({
  viajes,
  estado,
}: {
  readonly viajes: readonly ViajeResumen[];
  /** Estado seleccionado hoy, leido del search param de la ruta. */
  readonly estado?: EstadoViaje | undefined;
}) {
  return (
    <div className="flex flex-col gap-6">
      <HistorialHeader />
      <HistorialViajesTable viajes={viajes} estado={estado} />
    </div>
  );
}
