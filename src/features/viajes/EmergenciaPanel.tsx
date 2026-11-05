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
 * Fuera de alcance V1: sin ubicación en el payload; la activación no crea incidencia ni
 * condición; las notas son unidireccionales (no hay conversación dentro del caso).
 */

import { useMemo, useState } from 'react';
import { Button, Card, CardBody, FormField, Modal, Select, Textarea } from '@ai27-tech/ui';
import { NOTA_EMERGENCIA_MAX_CHARS } from '@/lib/constants';
import type { EmergenciaCliente } from '@/lib/contracts';
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

export function EmergenciaPanel({ viajeId }: { readonly viajeId: string }) {
  const { consulta, activar, agregarNota } = useEmergencias(viajeId);

  const [confirmando, setConfirmando] = useState(false);
  const [nota, setNota] = useState('');
  const [casoSeleccionado, setCasoSeleccionado] = useState('');
  const [avisoNota, setAvisoNota] = useState<string | null>(null);

  const casos = useMemo(() => consulta.data?.casos ?? [], [consulta.data]);
  const emergenciaActiva = consulta.data?.emergencia_activa ?? false;

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
    <Card variant="outlined" padding="lg" className="border-error/40">
      <CardBody className="flex flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-on-surface text-lg font-semibold">Emergencia</h2>
            <p className="text-on-surface-variant text-sm">
              {emergenciaActiva
                ? 'Hay una emergencia activa en este viaje.'
                : 'Si tu unidad está en riesgo, activa una emergencia.'}
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmando(true)} loading={activar.isPending}>
            Activar emergencia
          </Button>
        </header>

        {activar.isError && (
          <p role="alert" className="text-error text-sm">
            No pudimos activar la emergencia. Intenta de nuevo.
          </p>
        )}

        {casos.length === 0 ? (
          <p className="text-on-surface-variant text-sm">Sin emergencias en este viaje.</p>
        ) : (
          <section aria-labelledby="emergencia-casos" className="flex flex-col gap-3">
            <h3 id="emergencia-casos" className="text-sm font-semibold">
              Casos
            </h3>
            <ul className="flex flex-col gap-2">
              {casos.map((caso) => (
                <li
                  key={caso.id}
                  className="bg-error/5 flex items-center justify-between rounded-md px-3 py-2 text-sm"
                >
                  {/* Identificado SOLO por fecha/hora + estado: nada interno. */}
                  <span className="text-on-surface">{formatDateTime(caso.activada_en)}</span>
                  <span className="text-on-surface-variant text-xs">
                    {etiquetaEstado(caso.estado)}
                  </span>
                </li>
              ))}
            </ul>

            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                enviarNota();
              }}
            >
              {/* Selector SOLO cuando coexisten varios casos. Identifica por fecha/hora. */}
              {casos.length > 1 && (
                <FormField label="Caso">
                  <Select
                    value={casoDestino?.id ?? ''}
                    onChange={(event) => setCasoSeleccionado(event.target.value)}
                    aria-label="Caso de emergencia"
                  >
                    {casos.map((caso) => (
                      <option key={caso.id} value={caso.id}>
                        {formatDateTime(caso.activada_en)}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}

              <FormField label="Nota (opcional)">
                <Textarea
                  value={nota}
                  onChange={(event) => setNota(event.target.value)}
                  rows={3}
                  maxLength={NOTA_EMERGENCIA_MAX_CHARS}
                  placeholder="Describe la situación (opcional)"
                  aria-label="Nota de emergencia"
                />
              </FormField>

              {avisoNota !== null && (
                <p role="alert" className="text-error text-sm">
                  {avisoNota}
                </p>
              )}
              {agregarNota.isError && (
                <p role="alert" className="text-error text-sm">
                  No pudimos guardar la nota. Intenta de nuevo.
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-on-surface-variant text-xs">
                  {cuerpoRecortado.length}/{NOTA_EMERGENCIA_MAX_CHARS}
                </span>
                <Button
                  type="submit"
                  variant="secondary"
                  loading={agregarNota.isPending}
                  disabled={!notaEnviable}
                >
                  Agregar nota
                </Button>
              </div>
            </form>
          </section>
        )}
      </CardBody>

      <Modal
        open={confirmando}
        onClose={() => setConfirmando(false)}
        title="Activar emergencia"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarActivacion} loading={activar.isPending}>
              Activar ahora
            </Button>
          </div>
        }
      >
        <p className="text-on-surface text-sm">
          Se activará una emergencia para este viaje y el equipo de AI27 será notificado de
          inmediato. ¿Quieres continuar?
        </p>
      </Modal>
    </Card>
  );
}
