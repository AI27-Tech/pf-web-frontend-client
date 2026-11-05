/*
 * "Viajes en Curso": la tabla principal del panel.
 *
 * Presentacional: recibe las filas por props y no llama a la API. El folio enlaza al
 * detalle del viaje, que es la unica accion real de la tabla — el resto de la fila es
 * informacion.
 *
 * La tabla y su paginacion vienen del design system compartido (`@ai27-tech/ui`). Ese
 * `Table` es controlado: no ordena, selecciona ni pagina por su cuenta. Aqui se le da
 * lo minimo —seleccion por click y paginado de cliente— porque el bff todavia entrega
 * la lista completa. TODO(contracts): cuando el bff pagine, el numero de pagina pasa a
 * un search param de la ruta y la tabla recibira solo la pagina visible.
 *
 * El `Table` de la libreria calcula el padding de sus celdas a partir de dos tokens
 * (`--ui-table-cell-x/y`), cuyos valores por defecto quedan justos para esta tarjeta.
 * Se suben en el contenedor —donde se heredan hasta las celdas— a la escala de
 * espaciado de la libreria, sin `!important` ni tocar el CSS del paquete.
 */

import { useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Badge,
  Card,
  CardBody,
  Table,
  Pagination,
  type BadgeVariant,
  type Column,
} from '@ai27-tech/ui';
import type { EstadoViaje } from '@/lib/contracts';
import type { ViajeEnCurso } from './tipos';
import { EmptyState } from '@/components/ui/Feedback';
import { EtaCell } from './EtaCell';

/** Registros por pagina. El diseno del panel muestra tres filas por vista. */
const PAGE_SIZE = 3;

/**
 * Padding de las celdas, mas holgado que el default del design system. Se expresa con
 * los tokens de espaciado de la libreria para seguir su escala.
 */
const cellPadding = {
  '--ui-table-cell-x': 'var(--ui-space-3, 0.75rem)',
  '--ui-table-cell-y': 'var(--ui-space-2, 0.5rem)',
} as CSSProperties;

/** Etiquetas de los estados que el cliente conoce. Sin entrada por defecto. */
const labelByEstado: Readonly<Record<string, string>> = {
  SOLICITADO: 'Solicitado',
  EN_RUTA: 'En Ruta',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

/**
 * Estado del viaje -> senal tactica del `Badge` de la libreria:
 *   EN_RUTA               -> secure  (unidad en marcha, sin novedad)
 *   SOLICITADO/COMPLETADO -> escort  (informativo)
 *   CANCELADO             -> alert   (rojo)
 *   otro                  -> neutral
 */
function variantForEstado(estado: EstadoViaje): BadgeVariant {
  if (
    estado === 'EN_TRANSITO' ||
    estado === 'EN_EMBARQUE' ||
    estado === 'EN_DESTINO' ||
    estado === 'EN_DESCARGA' ||
    estado === 'PATRULLA_EN_CAMINO'
  ) {
    return 'secure';
  }
  if (estado === 'SOLICITADO' || estado === 'APROBADO' || estado === 'CERRADO') return 'escort';
  if (estado === 'CANCELADO') return 'alert';
  return 'neutral';
}

interface ViajesEnCursoTableProps {
  readonly viajes: readonly ViajeEnCurso[];
  /** Ancho maximo del ETA en caracteres. Se propaga a la celda. */
  readonly etaMaxChars?: number;
}

function buildColumns(etaMaxChars: number | undefined): Column<ViajeEnCurso>[] {
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
      // Una condicion activa manda sobre el estado: se pinta en `warning` y con su
      // descripcion, no con la etiqueta del estado. La primera condicion es la que vale.
      header: 'Estado',
      cell: (viaje) => {
        const condicion = viaje.condicionesActivas?.[0];
        const variant: BadgeVariant =
          condicion !== undefined ? 'warning' : variantForEstado(viaje.estado);
        const text = condicion?.descripcion ?? labelByEstado[viaje.estado] ?? viaje.estado;

        return (
          <Badge variant={variant} dot pill>
            {text}
          </Badge>
        );
      },
    },
    {
      key: 'eta',
      header: 'ETA',
      cell: (viaje) =>
        etaMaxChars !== undefined ? (
          <EtaCell eta={viaje.eta} maxChars={etaMaxChars} />
        ) : (
          <EtaCell eta={viaje.eta} />
        ),
    },
  ];
}

export function ViajesEnCursoTable({ viajes, etaMaxChars }: ViajesEnCursoTableProps) {
  const [page, setPage] = useState(1);

  // La pagina se acota al rango valido: si la lista encoge, no se queda una pagina
  // fuera de rango pintando un cuerpo vacio.
  const totalPages = Math.max(1, Math.ceil(viajes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = viajes.slice(start, start + PAGE_SIZE);

  return (
    <Card variant="outlined" padding="lg" className="h-full" style={cellPadding}>
      {/* `CardBody` aplica el padding de la prop y crece para llenar la altura. Se
          restablece el `padding-top` que la libreria reduce al asumir un `CardHeader`. */}
      <CardBody className="flex h-full flex-col gap-4">
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
          <>
            <Table
              aria-label="Viajes en curso de tu cuenta, con su estado y su hora estimada de llegada"
              columns={buildColumns(etaMaxChars)}
              data={[...visibleRows]}
              rowKey={(viaje) => viaje.viajeId}
            />

            <Pagination
              className="mt-auto"
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={viajes.length}
              onPageChange={setPage}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}
