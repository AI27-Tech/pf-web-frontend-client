/*
 * HistorialViajesTable: la tabla del Historial de Viajes.
 *
 * Presentacional: recibe las filas por props y no llama a la API. Usa `FilterTable` de
 * `@ai27-tech/ui`, que compone la barra de filtros (`FilterBar` con su `Select`) y la
 * `Table` en un solo bloque, y `Pagination` debajo. No se les cambia el aspecto desde aquí.
 *
 * FILTRO POR ESTADO: cableado (E9-T3 / AI27-22). El select de estado navega con un
 * search param de la ruta; el `loader` lo lee con `loaderDeps` y bff devuelve la
 * pagina ya filtrada. El filtrado es del SERVIDOR: la lista completa no vive en el
 * navegador. `estado` es el UNICO filtro que el contrato `listarViajes` soporta hoy.
 *
 * TODO(contracts): la PAGINACION sigue siendo estado de UI que recorta en cliente
 * sobre la pagina que bff devolvio. El contrato expone `cursor`, pero mover la
 * paginacion a search param + `cursor` es un paso aparte; aqui se prioriza cerrar el
 * filtro por estado. La lista completa no debe acumularse en el navegador.
 */

import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Truck } from 'lucide-react';
import {
  EmptyState,
  FilterTable,
  Pagination,
  Stack,
  type Column,
  type FilterDefinition,
  type SelectOption,
} from '@ai27-tech/ui';
import {
  EstadoViaje,
  type EstadoViaje as EstadoViajeTipo,
  type ViajeResumen,
} from '@/lib/contracts';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';
import { conservarFiltro } from '@/features/viajes/filtroEstado';

/**
 * Registros por página del historial.
 */
export const HISTORIAL_PAGE_SIZE = 10;
const OPCIONES_ESTADO: SelectOption[] = [
  { value: EstadoViaje.Solicitado, label: 'Solicitado' },
  { value: EstadoViaje.EnTransito, label: 'En tránsito' },
  { value: EstadoViaje.Cerrado, label: 'Cerrado' },
  { value: EstadoViaje.Cancelado, label: 'Cancelado' },
];

const FILTROS: FilterDefinition[] = [
  {
    key: 'estado',
    label: 'Estado',
    placeholder: 'Todos los estados',
    options: OPCIONES_ESTADO,
  },
];

/*
 * Columnas mínimas apegadas al contrato `ViajeResumen` ({id, estado, origen}). Las
 * columnas Folio/Fecha, Ruta (destino/sitios), Vehículo/Conductor y Reporte de
 * Seguridad se retiraron: el contrato no las define. Volverán cuando el contrato las
 * publique. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 *
 * Es función del filtro activo: el enlace al detalle lleva el `estado` del historial para
 * que volver al historial regrese al mismo listado filtrado.
 */
function crearColumnas(estado: EstadoViajeTipo | undefined): Column<ViajeResumen>[] {
  return [
    {
      key: 'id',
      header: 'ID',
      cell: (viaje) => (
        <Link
          to="/viajes/$viajeId"
          params={{ viajeId: viaje.id }}
          search={conservarFiltro(estado)}
          onClick={(evento) => evento.stopPropagation()}
          className="text-primary font-semibold hover:underline"
        >
          {viaje.id}
        </Link>
      ),
    },
    { key: 'origen', header: 'Origen', accessor: 'origen' },
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
  cargando = false,
}: {
  readonly viajes: readonly ViajeResumen[];
  /** Estado seleccionado hoy (viene del search param de la ruta). Vacio = todos. */
  readonly estado?: EstadoViajeTipo | undefined;
  readonly cargando?: boolean;
}) {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  /*
   * Cambiar el select de estado navega con el nuevo search param. `''` = todos, asi
   * que se limpia el search param. El loader re-corre por `loaderDeps` y bff devuelve
   * la pagina ya filtrada: el filtrado es del SERVIDOR, no del navegador.
   */
  function onEstadoChange(_clave: string, valor: string) {
    void navigate({
      to: '/viajes',
      search: valor === '' ? {} : { estado: valor as EstadoViajeTipo },
    });
    // Al cambiar el filtro, volver a la primera pagina del nuevo resultado.
    setPage(1);
  }

  function limpiarFiltros() {
    void navigate({ to: '/viajes', search: {} });
    setPage(1);
  }

  // Sin viajes Y sin filtro activo: la cuenta no tiene viajes. No hay nada que
  // filtrar, asi que se muestra el vacio sin la barra de filtros.
  if (!cargando && viajes.length === 0 && estado === undefined) {
    return (
      <EmptyState
        icon={<Truck />}
        title="No hay viajes en el historial"
        description="Cuando se registren viajes aparecerán aquí."
      />
    );
  }

  // La pagina se acota al rango valido: si la lista encoge, no se queda una pagina
  // fuera de rango pintando un cuerpo vacio.
  const totalPages = Math.max(1, Math.ceil(viajes.length / HISTORIAL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * HISTORIAL_PAGE_SIZE;
  const visibleRows = viajes.slice(start, start + HISTORIAL_PAGE_SIZE);

  return (
    <Stack gap={4}>
      <FilterTable
        aria-label="Historial de viajes de tu cuenta, con su origen y estado"
        columns={crearColumnas(estado)}
        data={[...visibleRows]}
        rowKey={(viaje) => viaje.id}
        loading={cargando}
        loadingRows={HISTORIAL_PAGE_SIZE}
        onRowClick={(viaje) =>
          void navigate({
            to: '/viajes/$viajeId',
            params: { viajeId: viaje.id },
            search: conservarFiltro(estado),
          })
        }
        filters={FILTROS}
        filterValues={{ estado: estado ?? '' }}
        onFilterChange={onEstadoChange}
        onClear={limpiarFiltros}
        // El conteo lo da `Pagination`; `FilterTable` no repite uno propio.
        hideCount
        // Filtro activo sin coincidencias: el `emptyState` de la propia tabla lo
        // explica, sin un segundo bloque de vacio y sin perder la barra de filtros.
        emptyState={
          <EmptyState
            size="sm"
            title="Sin resultados"
            description="Ningún viaje coincide con el estado seleccionado."
          />
        }
      />
      {!cargando && viajes.length > 0 && (
        <Pagination
          page={currentPage}
          pageSize={HISTORIAL_PAGE_SIZE}
          total={viajes.length}
          onPageChange={setPage}
        />
      )}
    </Stack>
  );
}
