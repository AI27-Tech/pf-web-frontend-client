/*
 * NuevaSolicitudForm — alta de servicio del portal del cliente (E1-HU-001, E9-T4).
 *
 * Captura EXACTAMENTE la forma del contrato `CrearViajeEntrada`:
 *   { origen, destinos:[{nombre, numero_envio?}], tipo_servicio?, fecha_hora_servicio?,
 *     cliente_id? }
 *
 * Reglas de negocio aplicadas (DEC-010, DEC-020 #1, DEC-017):
 *   - Origen y destino son TEXTO LIBRE y OBLIGATORIOS. El botón de envío queda
 *     DESHABILITADO mientras falte cualquiera de los dos (o cualquier parada quede
 *     vacía). No dependen de ningún catálogo: `rutas` no es catálogo en V1.
 *   - MÚLTIPLES PARADAS: un booleano "agregar paradas" que, al activarse, permite
 *     añadir destinos 1..N uno por uno (el contrato acepta `destinos: [{nombre}]`).
 *     Cada parada se puede agregar y quitar. Sin el booleano, hay un solo destino.
 *   - Tipo de servicio: el cliente PUEDE elegirlo del catálogo `tipos-servicio`. Su
 *     obligatoriedad NO está decidida, así que NO se fuerza en ninguna dirección.
 *   - Fecha/hora deseada: opcional (operación la fija antes de aprobar si falta).
 *   - El cliente/tenant NO se captura: lo deriva la identidad en el `bff` (DEC-010 #5).
 *
 * Fuera del contrato (NO se capturan aquí): operador y tracto son opcionales según
 * DEC-010 #4, pero `CrearViajeEntrada` no los modela; capturarlos sería inventar una
 * superficie que el contrato no acepta, así que se omiten (los completa el operador
 * interno en la bitácora). Documentos adjuntos: fuera de alcance de esta pantalla.
 *
 * El asistente rico de 4 pasos sigue desconectado en src/_desconectado/solicitud/.
 * Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Card, CardBody, Checkbox, FormField, Input, Select } from '@ai27-tech/ui';
import { crearViaje } from '@/lib/api/viajes';
import type { CrearViajeEntrada, OpcionCatalogo } from '@/lib/contracts';
import { isApiError } from '@/lib/api/errors';
import { onCut } from '@/lib/api/sessionCut';

interface NuevaSolicitudFormProps {
  /**
   * Catálogo de tipos de servicio para el select opcional. Puede venir vacío: el
   * catálogo es de PRESENTACIÓN y no bloqueante (el loader degrada a [] si no está).
   */
  readonly tiposServicio: readonly OpcionCatalogo[];
}

/** Un destino en edición: el nombre es texto libre; el número de envío es opcional. */
interface DestinoEnEdicion {
  readonly nombre: string;
  readonly numeroEnvio: string;
}

const DESTINO_VACIO: DestinoEnEdicion = { nombre: '', numeroEnvio: '' };

export function NuevaSolicitudForm({ tiposServicio }: NuevaSolicitudFormProps) {
  const navigate = useNavigate();

  const [origen, setOrigen] = useState('');
  // Siempre hay al menos un destino. Con "agregar paradas" se añaden más (1..N).
  const [destinos, setDestinos] = useState<readonly DestinoEnEdicion[]>([DESTINO_VACIO]);
  const [conParadas, setConParadas] = useState(false);
  const [tipoServicio, setTipoServicio] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creado, setCreado] = useState<{ id: string } | null>(null);
  const [avisoSesionFinalizada, setAvisoSesionFinalizada] = useState(false);

  useEffect(() => onCut(() => setAvisoSesionFinalizada(true)), []);

  function actualizarDestino(indice: number, patch: Partial<DestinoEnEdicion>): void {
    setDestinos((prev) => prev.map((d, i) => (i === indice ? { ...d, ...patch } : d)));
  }

  function agregarParada(): void {
    setDestinos((prev) => [...prev, DESTINO_VACIO]);
  }

  function quitarParada(indice: number): void {
    // Nunca se queda sin destinos: al quitar el último extra, vuelve a un solo destino.
    setDestinos((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== indice)));
  }

  function alternarParadas(activo: boolean): void {
    setConParadas(activo);
    // Al desactivar paradas, se conserva solo el primer destino.
    if (!activo) {
      setDestinos((prev) => [prev[0] ?? DESTINO_VACIO]);
    }
  }

  // Origen y todos los destinos deben tener texto. Esto gobierna el botón de envío.
  const origenCompleto = origen.trim() !== '';
  const destinosCompletos = destinos.every((d) => d.nombre.trim() !== '');
  const puedeEnviar = origenCompleto && destinosCompletos;

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    // Anti-doble-clic: mientras una creación está en vuelo, no se reenvía.
    if (pending) return;
    // Cinturón además del botón deshabilitado: si falta origen o destino, no se crea.
    if (!puedeEnviar) return;

    setError(null);
    setPending(true);

    // Solo los campos del contrato. `numero_envio` y los opcionales se omiten vacíos.
    const entrada: CrearViajeEntrada = {
      origen: origen.trim(),
      destinos: destinos.map((d) => ({
        nombre: d.nombre.trim(),
        ...(d.numeroEnvio.trim() !== '' ? { numero_envio: d.numeroEnvio.trim() } : {}),
      })),
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

  function reiniciar(): void {
    setCreado(null);
    setOrigen('');
    setDestinos([DESTINO_VACIO]);
    setConParadas(false);
    setTipoServicio('');
    setFechaHora('');
    setError(null);
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
            <Button variant="secondary" onClick={reiniciar}>
              Nueva solicitud
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  const destinoPrincipalLabel = conParadas ? 'Destino 1' : 'Destino';

  return (
    <Card variant="outlined" padding="lg" className="mx-auto w-full max-w-xl">
      <CardBody>
        {avisoSesionFinalizada && (
          <p role="alert" className="text-error mb-4 text-sm">
            Tu sesión finalizó. La información capturada no se envió.
          </p>
        )}
        <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
          <FormField label="Origen" required>
            <Input
              value={origen}
              onChange={(event) => setOrigen(event.target.value)}
              placeholder="Ciudad o sitio de origen"
              required
            />
          </FormField>

          <FormField label={destinoPrincipalLabel} required>
            <Input
              value={destinos[0]?.nombre ?? ''}
              onChange={(event) => actualizarDestino(0, { nombre: event.target.value })}
              placeholder="Ciudad o sitio de destino"
              required
            />
          </FormField>

          {conParadas && destinos[0] !== undefined && (
            <FormField label="Número de envío (opcional)">
              <Input
                value={destinos[0].numeroEnvio}
                onChange={(event) => actualizarDestino(0, { numeroEnvio: event.target.value })}
                placeholder="Referencia del envío"
                aria-label="Número de envío del destino 1"
              />
            </FormField>
          )}

          <FormField>
            <Checkbox
              label="Agregar paradas"
              checked={conParadas}
              onChange={(event) => alternarParadas(event.target.checked)}
            />
          </FormField>

          {conParadas &&
            destinos.slice(1).map((destino, offset) => {
              const indice = offset + 1;
              return (
                <div
                  key={indice}
                  className="border-outline-variant flex flex-col gap-3 rounded border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface text-sm font-semibold">
                      Parada {indice + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => quitarParada(indice)}
                      aria-label={`Quitar parada ${indice + 1}`}
                    >
                      Quitar
                    </Button>
                  </div>
                  <FormField label={`Destino ${indice + 1}`} required>
                    <Input
                      value={destino.nombre}
                      onChange={(event) =>
                        actualizarDestino(indice, { nombre: event.target.value })
                      }
                      placeholder="Ciudad o sitio de destino"
                      required
                    />
                  </FormField>
                  <FormField label="Número de envío (opcional)">
                    <Input
                      value={destino.numeroEnvio}
                      onChange={(event) =>
                        actualizarDestino(indice, { numeroEnvio: event.target.value })
                      }
                      placeholder="Referencia del envío"
                      aria-label={`Número de envío de la parada ${indice + 1}`}
                    />
                  </FormField>
                </div>
              );
            })}

          {conParadas && (
            <Button type="button" variant="outline" onClick={agregarParada}>
              Agregar otra parada
            </Button>
          )}

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

          <Button type="submit" loading={pending} disabled={!puedeEnviar} fullWidth>
            {pending ? 'Enviando' : 'Solicitar servicio'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
