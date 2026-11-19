/*
 * EmergenciaPanel — activación y notas de emergencia del cliente (E9-T9, AI27-28).
 *
 * Carril de audiencia Cliente (ADR 21 §6): el cliente SOLO ve lo que el `bff` proyecta
 * para su audiencia —un caso identificado por fecha/hora y un estado agregado—, nunca
 * cuerpos de nota, responsable, recursos ni personal de Reacción. Este componente, por
 * tanto, no renderiza ni pide ninguno de esos datos internos: solo fecha/hora + estado.
 *
 * Comportamiento (reglas del ticket):
 *   - El botón «Activar emergencia» CREA Y ENVÍA de inmediato un caso, sin exigir nota
 *     previa. Genera un `activacion_id` nuevo POR PULSACIÓN intencional (del botón del
 *     diálogo de confirmación), de modo que:
 *       · un reintento técnico de la MISMA mutación reusa el mismo id → no duplica;
 *       · una pulsación nueva genera otro id → crea otro caso.
 *   - Las notas son OPCIONALES, multilínea, de 1 a 1000 caracteres, recortando
 *     espacios. Un valor vacío o de solo espacios NO se envía.
 *   - Cuando coexisten varios casos, un selector mínimo identificado SOLO por fecha/hora
 *     elige a cuál caso va la nota. Con un solo caso, no hay selector.
 *
 * Regla de activación: SOLO con el viaje en recorrido (`EN_TRANSITO`, `EN_DESTINO` o
 * `EN_DESCARGA`; no `EN_EMBARQUE`) y SIN un caso previo sin resolver
 * (`abierta` o `en_atencion`); otra emergencia se activa hasta que la anterior esté `resuelta`.
 * Fuera de esa regla el botón no se ofrece (se explica por qué) y la lista de casos y las notas
 * siguen disponibles. El `bff`
 * aplica la misma regla con un 409: si el estado cambió entre el último polling y el clic,
 * la activación falla con un aviso claro en vez del error genérico.
 *
 * Fuera de alcance V1: sin ubicación en el payload; la activación no crea incidencia ni
 * condición; las notas son unidireccionales (no hay conversación dentro del caso).
 */

import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  EmptyState,
  Form,
  FormActions,
  FormField,
  Inline,
  Modal,
  Section,
  Select,
  SkeletonText,
  Stack,
  Textarea,
} from '@ai27-tech/ui';
import { NOTA_EMERGENCIA_MAX_CHARS } from '@/lib/constants';
import { isApiError } from '@/lib/api/errors';
import { EstadoViaje, type EmergenciaCliente } from '@/lib/contracts';
import { formatDateTime } from '@/lib/utils';
import { useEmergencias } from './useEmergencias';

/** Etiqueta visible del estado del caso, en la forma curada del cliente. */
function etiquetaEstado(estado: EmergenciaCliente['estado']): string {
  switch (estado) {
    case 'abierta':
    case 'en_atencion':
      // El cliente no distingue abierta de en_atencion salvo por el agregado: ambas
      // son «En atención» de cara a él (ADR 21 §6).
      return 'En atención';
    case 'resuelta':
      return 'Resuelta';
  }
}

/**
 * Estados del viaje en los que se puede activar una emergencia: el recorrido, es decir
 * EN_TRANSITO y el bucle de paradas EN_DESTINO y EN_DESCARGA (ADR 19, DEC-013).
 */
const ESTADOS_CON_EMERGENCIA: readonly string[] = [
  EstadoViaje.EnTransito,
  EstadoViaje.EnDestino,
  EstadoViaje.EnDescarga,
];

/**
 * Mensaje del fallo de activación. Un 409 del `bff` significa que el viaje ya no admite
 * emergencia (salió del recorrido o terminó); no se ata al `codigo` exacto para no copiar
 * un literal del contrato que aún no se publica.
 */
function mensajeErrorActivacion(error: unknown): string {
  if (isApiError(error) && error.status === 409) {
    return 'El viaje ya no admite emergencias en su estado actual, por eso no se pudo activar.';
  }
  return 'No pudimos activar la emergencia. Intenta de nuevo.';
}

export function EmergenciaPanel({
  viajeId,
  estadoViaje,
}: {
  readonly viajeId: string;
  /** Estado actual del viaje (hito del seguimiento). Solo el recorrido admite activar. */
  readonly estadoViaje: string;
}) {
  const { consulta, activar, agregarNota } = useEmergencias(viajeId);

  const [confirmando, setConfirmando] = useState(false);
  const [nota, setNota] = useState('');
  const [casoSeleccionado, setCasoSeleccionado] = useState('');
  const [avisoNota, setAvisoNota] = useState<string | null>(null);

  const casos = useMemo(() => consulta.data?.casos ?? [], [consulta.data]);
  // `emergencia_activa` = hay algún caso `abierta` o `en_atencion` (ADR 21 §6).
  const emergenciaActiva = consulta.data?.emergencia_activa ?? false;
  // Se activa solo con el viaje en recorrido Y sin un caso previo sin resolver: otra
  // emergencia hasta que la anterior esté `resuelta`.
  const enRecorrido = ESTADOS_CON_EMERGENCIA.includes(estadoViaje);
  const puedeActivar = enRecorrido && !emergenciaActiva;

  // El caso al que va la nota: el seleccionado si existe en la lista, o el único/primero.
  const casoDestino = useMemo(() => {
    if (casos.length === 0) return undefined;
    return casos.find((caso) => caso.id === casoSeleccionado) ?? casos[0];
  }, [casos, casoSeleccionado]);

  function confirmarActivacion(): void {
    // `activacion_id` POR PULSACIÓN: se genera aquí, al confirmar. Un reintento de la
    // misma mutación (p. ej. la red falló y TanStack Query reintenta) reusa este id;
    // una pulsación nueva vuelve a entrar aquí y genera otro.
    activar.mutate(
      { activacion_id: crypto.randomUUID() },
      { onSettled: () => setConfirmando(false) },
    );
  }

  function enviarNota(): void {
    if (casoDestino === undefined) return;
    const cuerpo = nota.trim();
    // Vacío o solo espacios: no se envía. Es la regla del ticket y del contrato.
    if (cuerpo === '') {
      setAvisoNota('Escribe una nota antes de enviarla.');
      return;
    }
    setAvisoNota(null);
    agregarNota.mutate({ emergenciaId: casoDestino.id, cuerpo }, { onSuccess: () => setNota('') });
  }

  const cuerpoRecortado = nota.trim();
  const notaEnviable =
    cuerpoRecortado.length >= 1 && cuerpoRecortado.length <= NOTA_EMERGENCIA_MAX_CHARS;

  return (
    <Card variant="outlined" padding="lg">
      <CardHeader
        media={<TriangleAlert aria-hidden="true" className="text-error" />}
        title="Emergencia"
        subtitle={
          emergenciaActiva
            ? 'Hay una emergencia activa en este viaje.'
            : enRecorrido
              ? 'Si tu unidad está en riesgo, actívala solo en caso real: notifica de inmediato a la central.'
              : 'La emergencia solo se puede activar durante el recorrido: en tránsito, en destino o en descarga.'
        }
      >
        {emergenciaActiva && <p>Podrás activar otra cuando la emergencia actual esté resuelta.</p>}
      </CardHeader>
      <CardBody>
        <Stack gap={4}>
          {puedeActivar && (
            <div>
              <Button
                variant="danger"
                onClick={() => setConfirmando(true)}
                loading={activar.isPending}
              >
                Activar emergencia
              </Button>
            </div>
          )}
          {activar.isError && (
            <Alert variant="danger">{mensajeErrorActivacion(activar.error)}</Alert>
          )}

          {consulta.isPending ? (
            <SkeletonText lines={2} />
          ) : casos.length === 0 ? (
            <EmptyState size="sm" title="Sin emergencias en este viaje." />
          ) : (
            <Section title="Casos">
              <Stack gap={3}>
                {/* Identificado SOLO por fecha/hora + estado: nada interno. */}
                <DescriptionList
                  columns={1}
                  orientation="horizontal"
                  items={casos.map((caso) => ({
                    label: formatDateTime(caso.activada_en),
                    value: (
                      <Badge variant={caso.estado === 'resuelta' ? 'secure' : 'warning'} pill>
                        {etiquetaEstado(caso.estado)}
                      </Badge>
                    ),
                  }))}
                />

                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    enviarNota();
                  }}
                >
                  {/* Selector SOLO cuando coexisten varios casos. Identifica por fecha/hora. */}
                  {casos.length > 1 && (
                    <FormField label="Caso de emergencia">
                      <Select
                        value={casoDestino?.id ?? ''}
                        onChange={(valor) => setCasoSeleccionado(String(valor))}
                        options={casos.map((caso) => ({
                          value: caso.id,
                          label: formatDateTime(caso.activada_en),
                        }))}
                      />
                    </FormField>
                  )}

                  <FormField label="Nota de emergencia" showOptional error={avisoNota ?? undefined}>
                    <Textarea
                      value={nota}
                      onChange={(event) => setNota(event.target.value)}
                      rows={3}
                      maxLength={NOTA_EMERGENCIA_MAX_CHARS}
                      showCount
                      placeholder="Describe la situación (opcional)"
                    />
                  </FormField>

                  {agregarNota.isError && (
                    <Alert variant="danger">No pudimos guardar la nota. Intenta de nuevo.</Alert>
                  )}

                  <FormActions>
                    <Button
                      type="submit"
                      variant="secondary"
                      loading={agregarNota.isPending}
                      disabled={!notaEnviable}
                    >
                      Agregar nota
                    </Button>
                  </FormActions>
                </Form>
              </Stack>
            </Section>
          )}
        </Stack>
      </CardBody>

      <Modal
        open={confirmando}
        onClose={() => setConfirmando(false)}
        title="Activar emergencia"
        footer={
          <Inline gap={3} justify="end">
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarActivacion} loading={activar.isPending}>
              Activar ahora
            </Button>
          </Inline>
        }
      >
        <p>
          Se activará una emergencia para este viaje y el equipo de AI27 será notificado de
          inmediato. ¿Quieres continuar?
        </p>
      </Modal>
    </Card>
  );
}
