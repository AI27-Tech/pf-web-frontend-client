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
 * token del enum del contrato, ADR 19). Si ninguna de las dos acciones aplica en el estado
 * actual (el viaje ya salió o ya finalizó), la tarjeta NO se pinta: no se ofrece nada que
 * falle al pulsar. La máquina de estados real vive en `operacion`:
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
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  FormField,
  Inline,
  Modal,
  Textarea,
} from '@ai27-tech/ui';
import { EstadoViaje, type ViajeSeguimiento } from '@/lib/contracts';
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

/** El botón de confirmar vive en el pie del diálogo, fuera del <form>: se asocia por este id. */
const ID_FORMULARIO_MOTIVO = 'form-motivo-transicion';

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

export function CancelarRechazarPanel({ viaje }: { readonly viaje: ViajeSeguimiento }) {
  const estado = viaje.hito.estado;
  const puedeCancelar = ESTADOS_CANCELABLES.includes(estado);
  const puedeRechazar = ESTADOS_RECHAZABLES.includes(estado);

  const mutacion = useTransicionViaje(viaje.id);

  const [accion, setAccion] = useState<AccionCliente | null>(null);
  const [motivo, setMotivo] = useState('');

  // Ni cancelar ni rechazar aplican
  const hayAcciones = puedeCancelar || puedeRechazar;
  if (!hayAcciones && accion === null) return null;

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
      {hayAcciones && (
        <Card variant="outlined" padding="lg">
          <CardHeader
            title="Cancelar o rechazar"
            subtitle="Puedes cancelar el viaje o rechazar el servicio mientras no haya salido."
          />
          <CardBody>
            <Inline gap={3} wrap>
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
            </Inline>
          </CardBody>
        </Card>
      )}

      <Modal
        open={meta !== null}
        onClose={cerrar}
        title={meta?.tituloDialogo ?? ''}
        footer={
          <Inline gap={3} justify="end">
            <Button variant="ghost" onClick={cerrar}>
              No, conservar
            </Button>
            <Button
              type="submit"
              form={ID_FORMULARIO_MOTIVO}
              variant={accion === 'cancelar' ? 'danger' : 'secondary'}
              loading={mutacion.isPending}
              // Refleja la regla `causa` obligatoria del servidor: sin motivo, no se
              // habilita (no dependemos solo del 400).
              disabled={motivoVacio}
            >
              {meta?.confirmar ?? 'Confirmar'}
            </Button>
          </Inline>
        }
      >
        {meta !== null && (
          <Form
            id={ID_FORMULARIO_MOTIVO}
            onSubmit={(event) => {
              event.preventDefault();
              confirmar();
            }}
            noValidate
          >
            <p>{meta.descripcion}</p>
            <FormField label={meta.etiquetaMotivo}>
              <Textarea
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                rows={3}
                placeholder="Escribe el motivo"
              />
            </FormField>
            {error !== null && <Alert variant="danger">{error}</Alert>}
          </Form>
        )}
      </Modal>
    </>
  );
}
