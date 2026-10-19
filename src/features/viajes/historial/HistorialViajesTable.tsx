/*
 * HistorialViajesTable: la tabla del Historial de Viajes.
 *
 * Presentacional: recibe las filas por props y no llama a la API. Usa el componente
 * `FilterTable` de `@ai27-tech/ui` —la pieza del design system pensada para "tabla con
 * barra de filtros"— que compone en un solo bloque la toolbar (busqueda + selects de
 * filtro + accion) y la `Table`. Antes esto se armaba a mano con `Form`/`FormField`
 * mas una tabla aparte, y el layout no seguia el sistema.
 *
 * SOLO FRONTEND. Busqueda y filtros son usables y conservan su valor, pero NO filtran:
 * el estado vive aqui y no toca ni la URL ni los datos. El boton "Filtrar" va
 * deshabilitado a proposito, con su motivo en el `title`.
 *
 * TODO(contracts): el filtrado y la paginacion son del servidor. Cuando exista el
 * contrato, busqueda/filtros/pagina alimentaran search params de la ruta (patron de
 * `login.tsx`) que el loader leera con `loaderDeps` para pedir a bff la pagina ya
 * filtrada. No se filtra ni pagina en cliente: la lista completa no vive en el navegador.
 */

import { useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, Card, CardBody, FilterTable, Pagination, type Column } from '@ai27-tech/ui';
import type { ViajeResumen } from '@/lib/contracts';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';
import { RutaCell } from './RutaCell';
import { UnidadCell } from './UnidadCell';
import { ReporteSeguridadCell } from './ReporteSeguridadCell';

/** Registros por pagina del historial. */
const PAGE_SIZE = 3;

/** Motivo del `title` del boton, para no repetirlo. */
const NO_FILTER_REASON = 'El filtrado se hara en el servidor (pendiente de contrato)';

/**
 * Padding de las celdas, mas holgado que el default del design system, expresado con
 * los tokens de espaciado de la libreria para seguir su escala (mismo criterio que la
 * tabla del panel).
 */
const cellPadding = {
  '--ui-table-cell-x': 'var(--ui-space-3, 0.75rem)',
  '--ui-table-cell-y': 'var(--ui-space-2, 0.5rem)',
} as CSSProperties;

/** Los filtros de la toolbar, declarativos. Placeholder = nombre accesible del select. */
const filtros = [
  {
    key: 'range',
    placeholder: 'Rango de fechas',
    options: [
      { value: '7d', label: 'Ultimos 7 dias' },
      { value: '30d', label: 'Ultimos 30 dias' },
      { value: '90d', label: 'Ultimos 90 dias' },
    ],
  },
  {
    key: 'estado',
    placeholder: 'Estado',
    options: [
      { value: '', label: 'Todos los estados' },
      { value: 'EN_RUTA', label: 'En Ruta' },
      { value: 'SOLICITADO', label: 'Solicitado' },
      { value: 'COMPLETADO', label: 'Completado' },
      { value: 'CANCELADO', label: 'Cancelado' },
    ],
  },
];

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
  const [page, setPage] = useState(1);

  // Estado de la toolbar: se conserva al escribir/elegir, pero no filtra nada.
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    range: '30d',
    estado: '',
  });

  if (viajes.length === 0) {
    return (
      <EmptyState title="No hay viajes en el historial">
        Cuando se registren viajes apareceran aqui.
      </EmptyState>
    );
  }

  // La pagina se acota al rango valido: si la lista encoge, no se queda una pagina
  // fuera de rango pintando un cuerpo vacio.
  const totalPages = Math.max(1, Math.ceil(viajes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = viajes.slice(start, start + PAGE_SIZE);

  return (
    <Card
      variant="outlined"
      padding="lg"
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={cellPadding}
    >
      {/* `CardBody` aplica el padding de la prop (`--card-pad`) y crece para llenar la
          altura; se restablece el `padding-top` que la libreria reduce al asumir un
          `CardHeader`. Con `padding="none"` el cuerpo quedaba pegado al borde. */}
      <CardBody className="flex h-full min-h-0 flex-col gap-4 pt-[var(--card-pad)]">
        <div className="min-h-0 flex-1 overflow-auto">
          <FilterTable
            // Toolbar del design system: busqueda + filtros + accion, con su layout.
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por ID de Vehiculo, Origen o Destino..."
            filters={filtros}
            filterValues={filterValues}
            onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
            toolbarActions={
              <Button type="button" variant="secondary" disabled title={NO_FILTER_REASON}>
                Filtrar
              </Button>
            }
            // El conteo lo muestra la `Pagination` de abajo ("X–Y of Z"); evitar duplicarlo.
            hideCount
            aria-label="Historial de viajes de tu cuenta, con su ruta, unidad, reporte de seguridad y estado"
            columns={[...columns]}
            data={[...visibleRows]}
            rowKey={(viaje) => viaje.id}
            className="min-w-[52rem]"
          />
        </div>

        <Pagination
          className="mt-auto"
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={viajes.length}
          onPageChange={setPage}
        />
      </CardBody>
    </Card>
  );
}
