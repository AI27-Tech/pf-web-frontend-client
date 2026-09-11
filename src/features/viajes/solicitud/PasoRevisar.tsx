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
import type { BorradorSolicitud, OpcionCatalogo } from '@/lib/contracts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
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

const SIN_DATO = 'No especificado';

function etiqueta(catalogo: readonly OpcionCatalogo[], id: string): string {
  if (id === '') return SIN_DATO;
  return catalogo.find((opcion) => opcion.id === id)?.nombre ?? id;
}

/** Fecha ISO (`yyyy-mm-dd`) a texto largo en espanol; vacio -> "sin dato". */
function formatFecha(iso: string): string {
  if (iso === '') return SIN_DATO;
  const fecha = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

function textoOSinDato(valor: string): string {
  return valor.trim() !== '' ? valor : SIN_DATO;
}

export function PasoRevisar({
  borrador,
  catalogos,
  onEditar,
  onRegresar,
  onEnviar,
}: PasoRevisarProps) {
  const [confirmado, setConfirmado] = useState(false);
  const { servicio, origen, destino, carga, documentacion } = borrador;

  // "Alto Valor" viaja como requisito de manejo; el chip lo refleja si esta marcado.
  const esAltoValor = carga.requisitos.includes('alto-valor');
  const requisitosTexto = carga.requisitos
    .map((id) => etiqueta(catalogos.requisitos, id))
    .join(', ');

  return (
    <div className="flex flex-col gap-4">
      <TarjetaResumen
        titulo="Servicio y Fecha"
        icono={<CalendarDays aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('servicio')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Tipo de servicio">
            {etiqueta(catalogos.tiposServicio, servicio.tipoServicio)}
          </Dato>
          <Dato etiqueta="Prioridad">
            <ChipPrioridad prioridad={servicio.prioridad} catalogo={catalogos.prioridades} />
          </Dato>
          <Dato etiqueta="Fecha de inicio">{formatFecha(servicio.fechaSalida)}</Dato>
          <Dato etiqueta="Hora">{textoOSinDato(servicio.horaSalida)}</Dato>
        </div>
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Ruta"
        icono={<Route aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('ruta')}
      >
        <div className="flex items-center justify-between gap-4">
          <Dato etiqueta="Origen">{textoOSinDato(origen.nombreLugar || origen.ciudadEstado)}</Dato>
          <span aria-hidden="true" className="text-on-surface-variant">
            →
          </span>
          <Dato etiqueta="Destino" alineado="right">
            {textoOSinDato(destino.nombreLugar || destino.ciudadEstado)}
          </Dato>
        </div>
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Detalles de Carga y Operación"
        icono={<Package aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('detalles')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Tipo de carga">{etiqueta(catalogos.categorias, carga.categoria)}</Dato>
          <Dato etiqueta="Valor declarado">
            {esAltoValor ? (
              <span className="bg-info-container text-on-info-container inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
                Alto Valor
              </span>
            ) : (
              etiqueta(catalogos.rangosValor, carga.valorEstimado)
            )}
          </Dato>
          <Dato etiqueta="Tipo de unidad">{textoOSinDato(carga.requerimientosVehiculo)}</Dato>
          <Dato etiqueta="Condiciones especiales">{textoOSinDato(requisitosTexto)}</Dato>
        </div>
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Documentación Adjunta"
        icono={<FileText aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('detalles')}
      >
        <p className="text-on-surface-variant text-sm">
          {textoOSinDato(documentacion.comentarios) === SIN_DATO
            ? 'Sin documentos adjuntos.'
            : documentacion.comentarios}
        </p>
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Instrucciones Adicionales"
        icono={<MessageSquareText aria-hidden="true" className="size-5" />}
        onEditar={() => onEditar('detalles')}
      >
        <p className="border-primary text-on-surface-variant border-l-4 pl-3 text-sm italic">
          {carga.instruccionesOperativas.trim() !== ''
            ? `“${carga.instruccionesOperativas}”`
            : 'Sin instrucciones adicionales.'}
        </p>
      </TarjetaResumen>

      <Card className="p-4" ariaLabel="Confirmación">
        <Checkbox
          label="Confirmo que la información proporcionada es correcta y acepto los términos de servicio."
          checked={confirmado}
          onChange={(evento) => setConfirmado(evento.target.checked)}
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onRegresar}>
          Regresar
        </Button>
        <Button variant="primary" onClick={onEnviar} disabled={!confirmado}>
          Enviar solicitud
        </Button>
      </div>
    </div>
  );
}

/* --- Piezas internas ------------------------------------------------------------- */

function TarjetaResumen({
  titulo,
  icono,
  onEditar,
  children,
}: {
  readonly titulo: string;
  readonly icono: ReactNode;
  readonly onEditar: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Card className="p-5" ariaLabel={titulo}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icono}</span>
          <h2 className="text-on-surface text-base font-semibold">{titulo}</h2>
        </div>
        <button
          type="button"
          onClick={onEditar}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Editar
        </button>
      </div>
      {children}
    </Card>
  );
}

function Dato({
  etiqueta,
  alineado = 'left',
  children,
}: {
  readonly etiqueta: string;
  readonly alineado?: 'left' | 'right';
  readonly children: ReactNode;
}) {
  return (
    <div className={cx('flex flex-col gap-1', alineado === 'right' && 'items-end text-right')}>
      <span className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">
        {etiqueta}
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
  if (prioridad === '') return <>{SIN_DATO}</>;
  // Alta/critica pesan como aviso -> par `error`; el resto, neutro.
  const esUrgente = prioridad === 'alta' || prioridad === 'critica';
  const clases = esUrgente
    ? 'bg-error-container text-on-error-container'
    : 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', clases)}>
      {etiqueta(catalogo, prioridad)}
    </span>
  );
}
