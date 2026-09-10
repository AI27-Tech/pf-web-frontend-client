/*
 * ViajesListSection. Section presentacional: recibe los datos por props y NO llama
 * a la API. El fetch lo hace el loader de la ruta.
 *
 * El alcance del listado lo decide bff a partir del claim de tenant del token. Aqui
 * no hay filtro por tenant, y no debe haberlo (P9).
 */

import { Link } from '@tanstack/react-router';
import type { ViajeResumen } from '@/lib/contracts';
import { Table, type Column } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';

const columns: readonly Column<ViajeResumen>[] = [
  {
    key: 'folio',
    header: 'Folio',
    cell: (viaje) => (
      <Link
        to="/viajes/$viajeId"
        params={{ viajeId: viaje.id }}
        className="text-brand-700 font-medium hover:underline"
      >
        {viaje.folio}
      </Link>
    ),
  },
  { key: 'estado', header: 'Estado', cell: (viaje) => viaje.estado },
  { key: 'origen', header: 'Origen', cell: (viaje) => viaje.origen },
  { key: 'destino', header: 'Destino', cell: (viaje) => viaje.destino },
  {
    key: 'solicitado',
    header: 'Solicitado',
    cell: (viaje) => formatDateTime(viaje.solicitadoEn),
  },
];

export function ViajesListSection({ viajes }: { readonly viajes: readonly ViajeResumen[] }) {
  if (viajes.length === 0) {
    return (
      <EmptyState title="Todavia no hay viajes">
        Cuando solicites un servicio aparecera aqui.
      </EmptyState>
    );
  }

  return (
    <Table
      caption="Viajes de tu cuenta"
      columns={columns}
      rows={viajes}
      rowKey={(viaje) => viaje.id}
    />
  );
}
