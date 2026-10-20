/*
 * Paso 4 — Revisar.
 *
 * Resumen de solo lectura del borrador, agrupado como en el diseno. Cada tarjeta trae
 * "Editar", que NO es una nueva pantalla: navega al paso correspondiente del mismo
 * asistente (el borrador se conserva). El envio se cierra tras una casilla de
 * confirmacion explicita — sin marcarla, "Enviar solicitud" queda deshabilitado.

 */

import { useState, type ReactNode } from 'react';
import { CalendarDays, FileText, MessageSquareText, Package, Pencil, Route } from 'lucide-react';
import type { BorradorSolicitud, OpcionCatalogo } from './tipos';
import { Button, Card, CardBody, Checkbox } from '@ai27-tech/ui';
import { cx } from '@/lib/utils';
import type { CatalogosSolicitud } from './pasos';
import type { PasoVisible } from './pasos';

interface PasoRevisarProps {
  readonly borrador: BorradorSolicitud;
  readonly catalogos: CatalogosSolicitud;
  readonly onEditar: (paso: PasoVisible) => void;
  readonly onRegresar: () => void;
  readonly onEnviar: () => void;
}

const NO_DATA = 'No especificado';

function labelFor(catalogo: readonly OpcionCatalogo[], id: string): string {
  if (id === '') return NO_DATA;
  return catalogo.find((option) => option.id === id)?.nombre ?? id;
}

/** Fecha ISO (`yyyy-mm-dd`) a texto largo en espanol; vacio -> "sin dato". */
function formatDate(iso: string): string {
  if (iso === '') return NO_DATA;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function textOrNoData(value: string): string {
  return value.trim() !== '' ? value : NO_DATA;
}

export function PasoRevisar({
  borrador,
  catalogos,
  onEditar,
  onRegresar,
  onEnviar,
}: PasoRevisarProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { servicio, origen, destino, carga, documentacion } = borrador;

  // "Alto Valor" viaja como requisito de manejo; el chip lo refleja si esta marcado.
  const isHighValue = carga.requisitos.includes('alto-valor');
  const requisitosText = carga.requisitos
    .map((id) => labelFor(catalogos.requisitos, id))
    .join(', ');

  return (
    <div className="flex flex-col gap-4">
      <TarjetaResumen
        title="Servicio y Fecha"
        icon={<CalendarDays aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('servicio')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Dato label="Tipo de servicio">
            {labelFor(catalogos.tiposServicio, servicio.tipoServicio)}
          </Dato>
          <Dato label="Prioridad">
            <ChipPrioridad prioridad={servicio.prioridad} catalogo={catalogos.prioridades} />
          </Dato>
          <Dato label="Fecha de inicio">{formatDate(servicio.fechaSalida)}</Dato>
          <Dato label="Hora">{textOrNoData(servicio.horaSalida)}</Dato>
        </div>
      </TarjetaResumen>

      <TarjetaResumen
        title="Ruta"
        icon={<Route aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('ruta')}
      >
        <div className="flex items-center justify-between gap-4">
          <Dato label="Origen">{textOrNoData(origen.nombreLugar || origen.ciudadEstado)}</Dato>
          <span aria-hidden="true" className="text-on-surface-variant">
            →
          </span>
          <Dato label="Destino" aligned="right">
            {textOrNoData(destino.nombreLugar || destino.ciudadEstado)}
          </Dato>
        </div>
      </TarjetaResumen>

      <TarjetaResumen
        title="Detalles de Carga y Operación"
        icon={<Package aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('detalles')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Dato label="Tipo de carga">{labelFor(catalogos.categorias, carga.categoria)}</Dato>
          <Dato label="Valor declarado">
            {isHighValue ? (
              <span className="bg-info-container text-on-info-container inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
                Alto Valor
              </span>
            ) : (
              labelFor(catalogos.rangosValor, carga.valorEstimado)
            )}
          </Dato>
          <Dato label="Tipo de unidad">{textOrNoData(carga.requerimientosVehiculo)}</Dato>
          <Dato label="Condiciones especiales">{textOrNoData(requisitosText)}</Dato>
        </div>
      </TarjetaResumen>

      <TarjetaResumen
        title="Documentación Adjunta"
        icon={<FileText aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('detalles')}
      >
        <p className="text-on-surface-variant text-sm">
          {textOrNoData(documentacion.comentarios) === NO_DATA
            ? 'Sin documentos adjuntos.'
            : documentacion.comentarios}
        </p>
      </TarjetaResumen>

      <TarjetaResumen
        title="Instrucciones Adicionales"
        icon={<MessageSquareText aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('detalles')}
      >
        <p className="border-primary text-on-surface-variant border-l-4 pl-3 text-sm italic">
          {carga.instruccionesOperativas.trim() !== ''
            ? `“${carga.instruccionesOperativas}”`
            : 'Sin instrucciones adicionales.'}
        </p>
      </TarjetaResumen>

      <Card variant="outlined" padding="md" aria-label="Confirmación">
        <CardBody>
          <Checkbox
            label="Confirmo que la información proporcionada es correcta y acepto los términos de servicio."
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onRegresar}>
          Regresar
        </Button>
        <Button variant="primary" onClick={onEnviar} disabled={!confirmed}>
          Enviar solicitud
        </Button>
      </div>
    </div>
  );
}

/* --- Piezas internas ------------------------------------------------------------- */

function TarjetaResumen({
  title,
  icon,
  onEditar,
  children,
}: {
  readonly title: string;
  readonly icon: ReactNode;
  readonly onEditar: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Card variant="outlined" padding="lg" role="region" aria-label={title}>
      <CardBody>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <h2 className="text-on-surface text-base font-semibold">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditar}
            startIcon={<Pencil aria-hidden="true" className="size-3.5" />}
          >
            Editar
          </Button>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

function Dato({
  label,
  aligned = 'left',
  children,
}: {
  readonly label: string;
  readonly aligned?: 'left' | 'right';
  readonly children: ReactNode;
}) {
  return (
    <div className={cx('flex flex-col gap-1', aligned === 'right' && 'items-end text-right')}>
      <span className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-on-surface text-sm">{children}</span>
    </div>
  );
}

function ChipPrioridad({
  prioridad,
  catalogo,
}: {
  readonly prioridad: string;
  readonly catalogo: readonly OpcionCatalogo[];
}) {
  if (prioridad === '') return <>{NO_DATA}</>;
  // Alta/critica pesan como aviso -> par `error`; el resto, neutro.
  const isUrgent = prioridad === 'alta' || prioridad === 'critica';
  const classes = isUrgent
    ? 'bg-error-container text-on-error-container'
    : 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', classes)}>
      {labelFor(catalogo, prioridad)}
    </span>
  );
}
