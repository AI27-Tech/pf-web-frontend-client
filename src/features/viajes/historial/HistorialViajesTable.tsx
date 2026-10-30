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
 * Lo que el contrato NO soporta se queda deshabilitado y honesto: el rango de fechas
 * (opciones deshabilitadas) y la busqueda de texto (no se renderiza). No se cablean.
 * El "Exportar CSV" (fuera de alcance V1, DEC-023) vive deshabilitado en el
 * encabezado (HistorialHeader), no en esta toolbar.
 *
 * TODO(contracts): la PAGINACION sigue siendo estado de UI que recorta en cliente
 * sobre la pagina que bff devolvio. El contrato expone `cursor`, pero mover la
 * paginacion a search param + `cursor` es un paso aparte; aqui se prioriza cerrar el
 * filtro por estado. La lista completa no debe acumularse en el navegador.
 */

import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Card, CardBody, FilterTable, Pagination, type Column } from '@ai27-tech/ui';
import {
  EstadoViaje,
  type EstadoViaje as EstadoViajeTipo,
  type ViajeResumen,
} from '@/lib/contracts';
import { EmptyState } from '@/components/ui/Feedback';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';

/** Registros por pagina del historial. */
const PAGE_SIZE = 3;

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
 * Los filtros de la toolbar, declarativos. Placeholder = nombre accesible del select.
 *
 * `estado` es el UNICO que el contrato soporta y el unico cableado: al cambiarlo se
 * navega con el nuevo search param y bff devuelve la pagina ya filtrada. Las opciones
 * distinguen "en curso" (SOLICITADO, EN_TRANSITO) de "cerrado" (CERRADO), mas CANCELADO.
 *
 * `range` (rango de fechas) NO lo soporta el contrato: se deja visible pero inerte,
 * con todas sus opciones deshabilitadas y un placeholder que lo explica. No navega.
 */
const FILTRO_ESTADO_KEY = 'estado';

const filtros = [
  {
    key: 'range',
    placeholder: 'Rango de fechas (no disponible)',
    options: [
      { value: '7d', label: 'Ultimos 7 dias', disabled: true },
      { value: '30d', label: 'Ultimos 30 dias', disabled: true },
      { value: '90d', label: 'Ultimos 90 dias', disabled: true },
    ],
  },
  {
    key: FILTRO_ESTADO_KEY,
    placeholder: 'Estado',
    options: [
      { value: '', label: 'Todos los estados' },
      { value: EstadoViaje.Solicitado, label: 'Solicitado' },
      { value: EstadoViaje.EnTransito, label: 'En tránsito' },
      { value: EstadoViaje.Cerrado, label: 'Cerrado' },
      { value: EstadoViaje.Cancelado, label: 'Cancelado' },
    ],
  },
];

/*
 * Columnas mínimas apegadas al contrato `ViajeResumen` ({id, estado, origen}). Las
 * columnas Folio/Fecha, Ruta (destino/sitios), Vehículo/Conductor y Reporte de
 * Seguridad se retiraron: el contrato no las define. Volverán cuando el contrato las
 * publique. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
const columns: readonly Column<ViajeResumen>[] = [
  {
    key: 'id',
    header: 'ID',
    cell: (viaje) => (
      <Link
        to="/viajes/$viajeId"
        params={{ viajeId: viaje.id }}
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

  // El valor del select de estado lo manda el search param, no un useState local:
  // la URL es la fuente de verdad del filtro (patron de `login.tsx`). El rango de
  // fechas queda inerte (opciones deshabilitadas), asi que su valor no importa.
  const filterValues: Record<string, string> = { estado: estado ?? '' };

  /*
   * Cambiar el select de estado navega con el nuevo search param. `''` = todos, asi
   * que se limpia el search param. El loader re-corre por `loaderDeps` y bff devuelve
   * la pagina ya filtrada: el filtrado es del SERVIDOR, no del navegador. El `range`
   * no esta cableado (sus opciones estan deshabilitadas); si llegara, se ignora.
   */
  function onFilterChange(key: string, value: string) {
    if (key !== FILTRO_ESTADO_KEY) return;
    void navigate({
      to: '/viajes',
      search: value === '' ? {} : { estado: value as EstadoViajeTipo },
    });
    // Al cambiar el filtro, volver a la primera pagina del nuevo resultado.
    setPage(1);
  }

  // Sin viajes Y sin filtro activo: la cuenta no tiene viajes. No hay nada que
  // filtrar, asi que se muestra el vacio sin la toolbar.
  if (viajes.length === 0 && estado === undefined) {
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
          {/* La toolbar se muestra siempre, aun con un filtro sin resultados: de otro
              modo el usuario quedaria atrapado en un filtro vacio sin volver a "todos". */}
          <FilterTable
            // Toolbar del design system: solo el filtro por estado. No hay boton de
            // accion: el cambio de estado navega al instante (no hay un "Filtrar" que
            // pulsar). "Exportar CSV" ya vive, deshabilitado, en el encabezado
            // (HistorialHeader): no se duplica aqui. La busqueda de texto NO se cablea
            // —`listarViajes` no la soporta—, asi que se omite `onSearchChange` y el
            // `FilterTable` no pinta un cuadro de busqueda inerte.
            filters={filtros}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            // El conteo lo muestra la `Pagination` de abajo ("X–Y of Z"); evitar duplicarlo.
            hideCount
            aria-label="Historial de viajes de tu cuenta, con su origen y estado"
            columns={[...columns]}
            data={[...visibleRows]}
            rowKey={(viaje) => viaje.id}
            // Filtro activo sin coincidencias: el `emptyState` de la propia tabla lo
            // explica, sin un segundo bloque de vacio y sin perder la toolbar.
            emptyState={
              <EmptyState title="Sin resultados">
                Ningun viaje coincide con el estado seleccionado.
              </EmptyState>
            }
            className="min-w-[32rem]"
          />
        </div>

        {/* Sin filas no hay paginas que recorrer: la `Pagination` se oculta. */}
        {viajes.length > 0 && (
          <Pagination
            className="mt-auto"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={viajes.length}
            onPageChange={setPage}
          />
        )}
      </CardBody>
    </Card>
  );
}
