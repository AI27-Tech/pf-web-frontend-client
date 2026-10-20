/*
 * NuevaSolicitudForm — formulario MÍNIMO de alta de servicio, apegado al contrato.
 *
 * Recorte al contrato (E8-T3): el contrato `CrearViajeEntrada` solo acepta
 * `{ origen, destinos:[{nombre, numero_envio?}], tipo_servicio?, fecha_hora_servicio?,
 * cliente_id? }`. El asistente rico de 4 pasos se conservó en src/_desconectado/solicitud/
 * para reconectar cuando el contrato soporte sus campos. Mientras tanto, esta pantalla
 * captura solo lo que el contrato define y crea un viaje real (POST /viajes).
 *
 * Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Card, CardBody, FormField, Input, Select } from '@ai27-tech/ui';
import { crearViaje } from '@/lib/api/viajes';
import type { CrearViajeEntrada, OpcionCatalogo } from '@/lib/contracts';
import { isApiError } from '@/lib/api/errors';

interface NuevaSolicitudFormProps {
  /** Catálogo de tipos de servicio para el select (único catálogo que el contrato usa). */
  readonly tiposServicio: readonly OpcionCatalogo[];
}

export function NuevaSolicitudForm({ tiposServicio }: NuevaSolicitudFormProps) {
  const navigate = useNavigate();

  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creado, setCreado] = useState<{ id: string } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);

    // Solo los campos del contrato. Los opcionales se omiten si están vacíos.
    const entrada: CrearViajeEntrada = {
      origen,
      destinos: [{ nombre: destino }],
      ...(tipoServicio !== '' ? { tipo_servicio: tipoServicio } : {}),
      ...(fechaHora !== '' ? { fecha_hora_servicio: new Date(fechaHora).toISOString() } : {}),
    };

    try {
      const viaje = await crearViaje(entrada);
      setCreado({ id: viaje.id });
    } catch (cause) {
      if (isApiError(cause) && cause.esDegradacion) {
        setError('El servicio no responde. Intenta de nuevo en un momento.');
      } else {
        setError('No pudimos crear la solicitud. Revisa los datos e intenta de nuevo.');
      }
    } finally {
      setPending(false);
    }
  }

  if (creado !== null) {
    return (
      <Card variant="outlined" padding="lg" className="mx-auto w-full max-w-xl">
        <CardBody className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-on-surface text-2xl font-bold">Solicitud enviada</h2>
          <p className="text-on-surface-variant text-sm">
            ID del viaje:{' '}
            <span className="text-primary bg-surface-container rounded px-2 py-0.5 font-semibold">
              {creado.id}
            </span>
          </p>
          <p className="text-on-surface-variant max-w-md text-sm">
            El viaje entra en estado Solicitado. AI27 revisará los detalles para asignar los
            recursos necesarios.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" onClick={() => void navigate({ to: '/viajes' })}>
              Ver mis viajes
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCreado(null);
                setOrigen('');
                setDestino('');
                setTipoServicio('');
                setFechaHora('');
              }}
            >
              Nueva solicitud
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg" className="mx-auto w-full max-w-xl">
      <CardBody>
        <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
          <FormField label="Origen" required>
            <Input
              value={origen}
              onChange={(event) => setOrigen(event.target.value)}
              placeholder="Ciudad o sitio de origen"
              required
            />
          </FormField>

          <FormField label="Destino" required>
            <Input
              value={destino}
              onChange={(event) => setDestino(event.target.value)}
              placeholder="Ciudad o sitio de destino"
              required
            />
          </FormField>

          <FormField label="Tipo de servicio">
            <Select
              value={tipoServicio}
              onChange={(event) => setTipoServicio(event.target.value)}
              aria-label="Tipo de servicio"
            >
              <option value="">Selecciona un tipo</option>
              {tiposServicio.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Fecha y hora del servicio">
            <Input
              type="datetime-local"
              value={fechaHora}
              onChange={(event) => setFechaHora(event.target.value)}
              aria-label="Fecha y hora del servicio"
            />
          </FormField>

          {error !== null && (
            <p role="alert" className="text-error text-sm">
              {error}
            </p>
          )}

          <Button type="submit" loading={pending} fullWidth>
            {pending ? 'Enviando' : 'Solicitar servicio'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
