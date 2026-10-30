/*
 * CancelarRechazarPanel — cancelar o rechazar un viaje, carril cliente (E1-HU-002 /
 * E9-T7, AI27-26).
 *
 * Son DOS acciones distintas con DOS desenlaces distintos, no una con variantes:
 *   - **Cancelar** (`CANCELADO`): el cliente ya no quiere el servicio, antes de la
 *     salida. Disponible en SOLICITADO, APROBADO, ASIGNADO o APTO_PARA_SALIDA.
 *   - **Rechazar** (`RECHAZADO_POR_CLIENTE`): el cliente no acepta el servicio asignado.
 *     Disponible solo en ASIGNADO o APTO_PARA_SALIDA.
 * Cada botón abre su propio diálogo y produce su propio estado destino; la UI los
 * distingue con título, texto y etiqueta propios para que el cliente sepa cuál ejecutó.
 *
 * La disponibilidad se DERIVA del estado que ya trae `ViajeSeguimiento` (`hito.estado`,
 * token del enum del contrato, ADR 19). Si una acción no aplica en el estado actual, NO
 * se ofrece el botón y se explica por qué (p. ej. "el viaje ya salió" o "ya finalizó"),
 * en vez de dejar que falle al pulsar. La máquina de estados real vive en `operacion`:
 * esta guarda de UI es la primera línea, no la única (el servidor puede ganar una
 * carrera y responder 409; se maneja abajo).
 *
 * El motivo (`causa`) es OBLIGATORIO en ambas acciones (DEC-111): el botón de confirmar
 * queda deshabilitado mientras el motivo esté vacío. No dependemos solo del 400 del
 * servidor; la guarda está en la UI, y el 400 se maneja igual por si acaso.
 *
 * Fuera de alcance V1: cancelar/rechazar SOLO cambian de estado. Sin penalizaciones,
 * reembolsos ni flujo de aprobación.
 */

import { useState } from 'react';
import { Button, Card, CardBody, FormField, Modal, Textarea } from '@ai27-tech/ui';
import { EstadoViaje, esTerminal, type ViajeSeguimiento } from '@/lib/contracts';
import { isApiError } from '@/lib/api/errors';
import { useTransicionViaje } from './useTransicionViaje';

/** Estados en los que el cliente todavía puede CANCELAR (antes de la salida). */
const ESTADOS_CANCELABLES: readonly string[] = [
  EstadoViaje.Solicitado,
  EstadoViaje.Aprobado,
  EstadoViaje.Asignado,
  EstadoViaje.AptoParaSalida,
];

/** Estados en los que el cliente puede RECHAZAR el servicio asignado. */
const ESTADOS_RECHAZABLES: readonly string[] = [EstadoViaje.Asignado, EstadoViaje.AptoParaSalida];

/** La acción que el cliente está confirmando en el diálogo abierto. */
type AccionCliente = 'cancelar' | 'rechazar';

const META: Record<
  AccionCliente,
  {
    readonly aEstado: Extract<EstadoViaje, 'CANCELADO' | 'RECHAZADO_POR_CLIENTE'>;
    readonly tituloBoton: string;
    readonly tituloDialogo: string;
    readonly descripcion: string;
    readonly etiquetaMotivo: string;
    readonly confirmar: string;
  }
> = {
  cancelar: {
    aEstado: EstadoViaje.Cancelado,
    tituloBoton: 'Cancelar viaje',
    tituloDialogo: 'Cancelar el viaje',
    descripcion:
      'El viaje se cancelará y no se realizará el servicio. Esta acción no se puede deshacer. Cuéntanos el motivo.',
    etiquetaMotivo: 'Motivo de la cancelación',
    // Etiqueta de confirmar DISTINTA del botón que abre el diálogo: así la acción de
    // confirmar es inequívoca (no choca con el disparador) y el cliente sabe qué ejecuta.
    confirmar: 'Confirmar cancelación',
  },
  rechazar: {
    aEstado: EstadoViaje.RechazadoPorCliente,
    tituloBoton: 'Rechazar servicio',
    tituloDialogo: 'Rechazar el servicio asignado',
    descripcion:
      'Rechazarás el servicio que AI27 asignó a este viaje. Esta acción no se puede deshacer. Cuéntanos el motivo.',
    etiquetaMotivo: 'Motivo del rechazo',
    confirmar: 'Confirmar rechazo',
  },
};

/** Mensaje de por qué ya no se puede cancelar/rechazar, según el estado. */
function explicacionNoDisponible(estado: string): string {
  if (esTerminal(estado as EstadoViaje)) {
    return 'Este viaje ya finalizó, así que ya no puede cancelarse ni rechazarse.';
  }
  // Único caso no-terminal fuera de la ventana: el viaje ya salió (EN_EMBARQUE,
  // PATRULLA_EN_CAMINO, EN_TRANSITO, EN_DESTINO, EN_DESCARGA).
  return 'El viaje ya salió, así que ya no puede cancelarse ni rechazarse. Si necesitas ayuda, contacta a AI27.';
}

export function CancelarRechazarPanel({ viaje }: { readonly viaje: ViajeSeguimiento }) {
  const estado = viaje.hito.estado;
  const puedeCancelar = ESTADOS_CANCELABLES.includes(estado);
  const puedeRechazar = ESTADOS_RECHAZABLES.includes(estado);

  const mutacion = useTransicionViaje(viaje.id);

  const [accion, setAccion] = useState<AccionCliente | null>(null);
  const [motivo, setMotivo] = useState('');

  // Ni cancelar ni rechazar aplican: no se ofrece nada, se explica por qué.
  if (!puedeCancelar && !puedeRechazar) {
    return (
      <Card variant="outlined" padding="lg">
        <CardBody>
          <h2 className="text-on-surface text-lg font-semibold">Cancelar o rechazar</h2>
          <p className="text-on-surface-variant mt-1 text-sm">{explicacionNoDisponible(estado)}</p>
        </CardBody>
      </Card>
    );
  }

  function abrir(cual: AccionCliente): void {
    setAccion(cual);
    setMotivo('');
    mutacion.reset();
  }

  function cerrar(): void {
    setAccion(null);
    setMotivo('');
    mutacion.reset();
  }

  function confirmar(): void {
    if (accion === null) return;
    const causa = motivo.trim();
    // Guarda de la regla `causa` obligatoria (DEC-111): no mandamos sin motivo.
    if (causa === '') return;
    mutacion.mutate({ aEstado: META[accion].aEstado, causa }, { onSuccess: () => cerrar() });
  }

  const meta = accion !== null ? META[accion] : null;
  const motivoVacio = motivo.trim() === '';

  // Taxonomía de respuestas del servidor para el mensaje del diálogo (verificado con
  // contrato/servicio): 409 = carrera de la máquina de estados; 400 = motivo/cuerpo
  // inválido; 404 = fuera de alcance (tratado como "no encontrado", no como permiso).
  function mensajeError(): string | null {
    const error = mutacion.error;
    if (!isApiError(error))
      return error === null ? null : 'No pudimos completar la acción. Intenta de nuevo.';
    if (error.status === 409) {
      return 'El viaje cambió de estado mientras confirmabas (quizá ya salió). Cierra este diálogo; la vista se actualizará con el estado más reciente.';
    }
    if (error.status === 400) {
      return 'Falta el motivo o no es válido. Escribe por qué y vuelve a intentar.';
    }
    if (error.status === 404) {
      return 'No encontramos este viaje. Es posible que ya no esté disponible.';
    }
    return 'No pudimos completar la acción. Intenta de nuevo.';
  }

  const error = mensajeError();

  return (
    <>
      <Card variant="outlined" padding="lg">
        <CardBody className="flex flex-col gap-3">
          <div>
            <h2 className="text-on-surface text-lg font-semibold">Cancelar o rechazar</h2>
            <p className="text-on-surface-variant text-sm">
              Puedes cancelar el viaje o rechazar el servicio mientras no haya salido.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {puedeCancelar && (
              <Button variant="danger" onClick={() => abrir('cancelar')}>
                {META.cancelar.tituloBoton}
              </Button>
            )}
            {puedeRechazar && (
              <Button variant="secondary" onClick={() => abrir('rechazar')}>
                {META.rechazar.tituloBoton}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={meta !== null}
        onClose={cerrar}
        title={meta?.tituloDialogo ?? ''}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={cerrar}>
              No, conservar
            </Button>
            <Button
              variant={accion === 'cancelar' ? 'danger' : 'secondary'}
              onClick={confirmar}
              loading={mutacion.isPending}
              // Refleja la regla `causa` obligatoria del servidor: sin motivo, no se
              // habilita (no dependemos solo del 400).
              disabled={motivoVacio}
            >
              {meta?.confirmar ?? 'Confirmar'}
            </Button>
          </div>
        }
      >
        {meta !== null && (
          <div className="flex flex-col gap-3">
            <p className="text-on-surface text-sm">{meta.descripcion}</p>
            <FormField label={meta.etiquetaMotivo}>
              <Textarea
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                rows={3}
                placeholder="Escribe el motivo"
                aria-label={meta.etiquetaMotivo}
              />
            </FormField>
            {error !== null && (
              <p role="alert" className="text-error text-sm">
                {error}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
