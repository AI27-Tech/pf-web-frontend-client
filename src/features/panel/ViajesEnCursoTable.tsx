/*
 * "Viajes en Curso": la tabla principal del panel.
 *
 * Presentacional: recibe las filas por props y no llama a la API. El folio enlaza al
 * detalle del viaje, que es la unica accion real de la tabla — el resto de la fila es
 * informacion.
 *
 */

import { Link } from '@tanstack/react-router';
import type { ViajeEnCurso } from '@/lib/contracts';
import { Card } from '@/components/ui/Card';
import { Table, type Column } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';
import { EtaCell } from './EtaCell';

interface ViajesEnCursoTableProps {
  readonly viajes: readonly ViajeEnCurso[];
  /** Ancho maximo del ETA en caracteres. Se propaga a la celda. */
  readonly etaMaxCaracteres?: number;
}

function columnas(etaMaxCaracteres: number | undefined): readonly Column<ViajeEnCurso>[] {
  return [
    {
      key: 'folio',
      header: 'ID Viaje',
      cell: (viaje) => (
        <Link
          to="/viajes/$viajeId"
          params={{ viajeId: viaje.viajeId }}
          className="text-primary font-semibold hover:underline"
        >
          {viaje.folio}
        </Link>
      ),
    },
    {
      key: 'ruta',
      header: 'Origen / Destino',
      cell: (viaje) => (
        <div className="flex flex-col">
          <span className="text-on-surface font-semibold">{viaje.origen}</span>
          <span className="text-on-surface-variant text-xs">{viaje.destino}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (viaje) => (
        <EstadoViajeChip estado={viaje.estado} condicionesActivas={viaje.condicionesActivas} />
      ),
    },
    {
      key: 'eta',
      header: 'ETA',
      cell: (viaje) =>
        etaMaxCaracteres !== undefined ? (
          <EtaCell eta={viaje.eta} maxCaracteres={etaMaxCaracteres} />
        ) : (
          <EtaCell eta={viaje.eta} />
        ),
    },
  ];
}

export function ViajesEnCursoTable({ viajes, etaMaxCaracteres }: ViajesEnCursoTableProps) {
  return (
    <Card className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-on-surface text-xl font-bold sm:text-2xl">Viajes en Curso</h2>

        {/* "Ver todos" lleva al listado completo de viajes. */}
        <Link to="/viajes" className="text-primary text-sm font-semibold hover:underline">
          Ver todos
        </Link>
      </div>

      {viajes.length === 0 ? (
        <EmptyState title="No hay viajes en curso">
          Cuando un servicio se ponga en marcha aparecera aqui.
        </EmptyState>
      ) : (
        <Table
          caption="Viajes en curso de tu cuenta, con su estado y su hora estimada de llegada"
          columns={columnas(etaMaxCaracteres)}
          rows={viajes}
          rowKey={(viaje) => viaje.viajeId}
          headerTone="muted"
          selectable
          minWidthClass="min-w-[36rem]"
        />
      )}
    </Card>
  );
}
