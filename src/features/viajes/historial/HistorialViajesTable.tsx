/*
 * HistorialViajesTable: la tabla del Historial de Viajes.
 *
 * Presentacional: recibe las filas por props y no llama a la API. Usa el componente
 * `FilterTable` de `@ai27-tech/ui` —la pieza del design system pensada para "tabla con
 * barra de filtros"— que compone en un solo bloque la toolbar (busqueda + selects de
 * filtro + accion) y la `Table`. Antes esto se armaba a mano con `Form`/`FormField`
 * mas una tabla aparte, y el layout no seguia el sistema.
 *
 * FILTRO POR ESTADO: cableado (E9-T3 / AI27-22). El select de estado navega con un
 * search param de la ruta; el `loader` lo lee con `loaderDeps` y bff devuelve la
 * pagina ya filtrada. El filtrado es del SERVIDOR: la lista completa no vive en el
 * navegador. `estado` es el UNICO filtro que el contrato `listarViajes` soporta hoy.
 *
 *
 * TODO(contracts): la PAGINACION sigue siendo estado de UI que recorta en cliente
 * sobre la pagina que bff devolvio. El contrato expone `cursor`, pero mover la
 * paginacion a search param + `cursor` es un paso aparte; aqui se prioriza cerrar el
 * filtro por estado. La lista completa no debe acumularse en el navegador.
 */

import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Pagination, Select, Table, type Column, type SelectOption } from '@ai27-tech/ui';
import {
  EstadoViaje,
  type EstadoViaje as EstadoViajeTipo,
  type ViajeResumen,
} from '@/lib/contracts';
import { EmptyState } from '@/components/ui/Feedback';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';
import { conservarFiltro } from '@/features/viajes/filtroEstado';

/**
 * Registros por página del historial.
 */
export const HISTORIAL_PAGE_SIZE = 10;

/**
 * Padding de las celdas, mas holgado que el default del design system, expresado con
 * los tokens de espaciado de la libreria para seguir su escala (mismo criterio que la
 * tabla del panel).
 */
const cellPadding = {
  '--ui-table-cell-x': 'var(--ui-space-3, 0.75rem)',
  '--ui-table-cell-y': 'var(--ui-space-2, 0.5rem)',
} as CSSProperties;

/*
 * Opciones del filtro por estado.
 */
const OPCIONES_ESTADO: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: EstadoViaje.Solicitado, label: 'Solicitado' },
  { value: EstadoViaje.EnTransito, label: 'En tránsito' },
  { value: EstadoViaje.Cerrado, label: 'Cerrado' },
  { value: EstadoViaje.Cancelado, label: 'Cancelado' },
];

const OPCIONES_RANGO: SelectOption[] = [
  { value: '7d', label: 'Ultimos 7 dias', disabled: true },
  { value: '30d', label: 'Ultimos 30 dias', disabled: true },
  { value: '90d', label: 'Ultimos 90 dias', disabled: true },
];

/*
 * Columnas mínimas apegadas al contrato `ViajeResumen` ({id, estado, origen}). Las
 * columnas Folio/Fecha, Ruta (destino/sitios), Vehículo/Conductor y Reporte de
 * Seguridad se retiraron: el contrato no las define. Volverán cuando el contrato las
 * publique. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 *
 * Es función del filtro activo: el enlace al detalle lleva el `estado` del historial para
 * que "Volver al historial" regrese al mismo listado filtrado.
 */
function crearColumnas(estado: EstadoViajeTipo | undefined): readonly Column<ViajeResumen>[] {
  return [
    {
      key: 'id',
      header: 'ID',
      cell: (viaje) => (
        <Link
          to="/viajes/$viajeId"
          params={{ viajeId: viaje.id }}
          search={conservarFiltro(estado)}
          className="text-primary font-semibold hover:underline"
        >
          {viaje.id}
        </Link>
      ),
    },
    {
      key: 'origen',
      header: 'Origen',
      cell: (viaje) => <span className="text-on-surface">{viaje.origen}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (viaje) => <EstadoViajeChip estado={viaje.estado} />,
    },
  ];
}

export function HistorialViajesTable({
  viajes,
  estado,
}: {
  readonly viajes: readonly ViajeResumen[];
  /** Estado seleccionado hoy (viene del search param de la ruta). Vacio = todos. */
  readonly estado?: EstadoViajeTipo | undefined;
}) {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  /*
   * Cambiar el select de estado navega con el nuevo search param. `''` = todos, asi
   * que se limpia el search param. El loader re-corre por `loaderDeps` y bff devuelve
   * la pagina ya filtrada: el filtrado es del SERVIDOR, no del navegador.
   */
  function onEstadoChange(valor: string | number) {
    const nuevo = String(valor);
    void navigate({
      to: '/viajes',
      search: nuevo === '' ? {} : { estado: nuevo as EstadoViajeTipo },
    });
    // Al cambiar el filtro, volver a la primera pagina del nuevo resultado.
    setPage(1);
  }

  // Sin viajes Y sin filtro activo: la cuenta no tiene viajes. No hay nada que
  // filtrar, asi que se muestra el vacio sin la barra de filtros.
  if (viajes.length === 0 && estado === undefined) {
    return (
      <EmptyState title="No hay viajes en el historial">
        Cuando se registren viajes apareceran aqui.
      </EmptyState>
    );
  }

  // La pagina se acota al rango valido: si la lista encoge, no se queda una pagina
  // fuera de rango pintando un cuerpo vacio.
  const totalPages = Math.max(1, Math.ceil(viajes.length / HISTORIAL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * HISTORIAL_PAGE_SIZE;
  const visibleRows = viajes.slice(start, start + HISTORIAL_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4" style={cellPadding}>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Rango de fechas" className="w-full sm:w-64">
          <Select options={OPCIONES_RANGO} placeholder="Rango de fechas (no disponible)" />
        </div>
        <div role="group" aria-label="Estado" className="w-full sm:w-52">
          <Select value={estado ?? ''} options={OPCIONES_ESTADO} onChange={onEstadoChange} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          aria-label="Historial de viajes de tu cuenta, con su origen y estado"
          columns={[...crearColumnas(estado)]}
          data={[...visibleRows]}
          rowKey={(viaje) => viaje.id}
          // Filtro activo sin coincidencias: el `emptyState` de la propia tabla lo
          // explica, sin un segundo bloque de vacio y sin perder la barra de filtros.
          emptyState={
            <EmptyState title="Sin resultados">
              Ningun viaje coincide con el estado seleccionado.
            </EmptyState>
          }
          className="min-w-[32rem]"
        />
      </div>
      {viajes.length > 0 && (
        <Pagination
          page={currentPage}
          pageSize={HISTORIAL_PAGE_SIZE}
          total={viajes.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
