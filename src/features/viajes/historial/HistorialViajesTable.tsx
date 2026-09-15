/*
 * HistorialViajesTable: la tabla del Historial de Viajes.
 *
 * Presentacional: recibe las filas por props y no llama a la API. Compone las cinco
 * columnas del diseno sobre la primitiva `Table`, que es la MISMA que usa la tabla del
 * panel. El folio enlaza al detalle.
 */

import { Link } from '@tanstack/react-router';
import type { ViajeResumen } from '@/lib/contracts';
import { Card } from '@/components/ui/Card';
import { Table, type Column } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';
import { RutaCell } from './RutaCell';
import { UnidadCell } from './UnidadCell';
import { ReporteSeguridadCell } from './ReporteSeguridadCell';

/** Registros por pagina del historial. */
const PAGE_SIZE = 3;

const columns: readonly Column<ViajeResumen>[] = [
  {
    key: 'id',
    header: 'ID / Fecha',
    cell: (viaje) => (
      <div className="flex flex-col">
        <Link
          to="/viajes/$viajeId"
          params={{ viajeId: viaje.id }}
          className="text-primary font-semibold hover:underline"
        >
          {viaje.folio}
        </Link>
        <span className="text-on-surface-variant text-xs">
          {formatDateTime(viaje.solicitadoEn)}
        </span>
      </div>
    ),
  },
  {
    key: 'ruta',
    header: 'Ruta (Origen → Destino)',
    cell: (viaje) => (
      <RutaCell
        origen={viaje.origen}
        origenSitio={viaje.origenSitio}
        destino={viaje.destino}
        destinoSitio={viaje.destinoSitio}
      />
    ),
  },
  {
    key: 'unidad',
    header: 'Vehiculo / Conductor',
    cell: (viaje) => <UnidadCell unidad={viaje.unidad} />,
  },
  {
    key: 'reporte',
    header: 'Reporte Seguridad',
    cell: (viaje) => <ReporteSeguridadCell reporte={viaje.reporteSeguridad} />,
  },
  {
    key: 'estado',
    header: 'Estado',
    cell: (viaje) => <EstadoViajeChip estado={viaje.estado} condicionesActivas={[]} />,
  },
];

export function HistorialViajesTable({ viajes }: { readonly viajes: readonly ViajeResumen[] }) {
  if (viajes.length === 0) {
    return (
      <EmptyState title="No hay viajes en el historial">
        Cuando se registren viajes apareceran aqui.
      </EmptyState>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <Table
        caption="Historial de viajes de tu cuenta, con su ruta, unidad, reporte de seguridad y estado"
        columns={columns}
        rows={viajes}
        rowKey={(viaje) => viaje.id}
        headerTone="filled"
        minWidthClass="min-w-[52rem]"
        // La fila de un viaje cancelado se resalta en tono de error.
        rowTone={(viaje) => (viaje.estado === 'CANCELADO' ? 'error' : 'default')}
        pageSize={PAGE_SIZE}
        fill
      />
    </Card>
  );
}
