/*
 * HistorialViajesSection: la `*Section` del Historial de Viajes.
 *
 * Presentacional: recibe los viajes por props y NO llama a la API. El fetch lo hace el
 * `loader` de la ruta, que es la frontera. Aqui solo hay composicion: encabezado y el
 * listado (filtros, tabla y paginacion).
 *
 */

import { PageHeader, Stack } from '@ai27-tech/ui';
import type { EstadoViaje, ViajeResumen } from '@/lib/contracts';
import { HistorialViajesTable } from './HistorialViajesTable';

export function HistorialViajesSection({
  viajes,
  estado,
  cargando = false,
}: {
  readonly viajes: readonly ViajeResumen[];
  /** Estado seleccionado hoy, leido del search param de la ruta. */
  readonly estado?: EstadoViaje | undefined;
  readonly cargando?: boolean;
}) {
  return (
    <Stack gap={6}>
      <PageHeader
        title="Historial de Viajes"
        description="Consulta los registros detallados de todas las operaciones logísticas y reportes de seguridad asociados."
      />
      <HistorialViajesTable viajes={viajes} estado={estado} cargando={cargando} />
    </Stack>
  );
}
