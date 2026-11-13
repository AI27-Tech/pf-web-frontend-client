/*
 * NuevaSolicitudForm — alta de servicio del portal del cliente (E1-HU-001, E9-T4).
 *
 * Captura EXACTAMENTE la forma del contrato `CrearViajeEntrada`:
 *   { origen, destinos:[{nombre, numero_envio?}], tipo_servicio?, fecha_hora_servicio?,
 *     cliente_id? }
 * El `numero_envio` de cada destino es opcional en el contrato y esta pantalla NO lo
 * captura (instrucción de Product Management): ningún destino lo lleva.
 *
 * Disposición: el formulario a la izquierda y, a su derecha, una vista previa en vivo
 * (`SolicitudVistaPrevia`) con el origen, los destinos y el destino final capturados,
 * más el resto de los datos. En pantallas angostas la vista previa queda debajo.
 *
 * Modelo de la ruta: Origen → Destino 1..N → Destino final.
 *   - El DESTINO FINAL es siempre el último punto de la ruta. Es el único campo de destino
 *     obligatorio que no se numera.
 *   - Los DESTINOS (intermedios) son opcionales, van entre el origen y el destino final, y
 *     son los únicos que se numeran (Destino 1, Destino 2, …) según su posición. Se pueden
 *     reordenar arrastrándolos (ver `DestinosIntermedios`).
 *   - Al enviar, `destinos` del contrato lleva los destinos en su orden actual y el destino
 *     final AL ÚLTIMO: `[...destinos, destinoFinal]` (DEC-013: el último destino de la
 *     lista es el que cierra el viaje).
 *
 * Reglas de negocio aplicadas (DEC-010, DEC-020 #1, DEC-017):
 *   - Origen y destino final son TEXTO LIBRE y OBLIGATORIOS. El botón de envío queda
 *     DESHABILITADO mientras falte cualquiera de los dos (o cualquier destino quede
 *     vacío). No dependen de ningún catálogo: `rutas` no es catálogo en V1.
 *   - MÚLTIPLES DESTINOS: el interruptor "Seguimiento con múltiples destinos" va en la
 *     misma fila que la etiqueta del Destino final. Al activarse abre el primer destino
 *     intermedio y permite añadir 1..N uno por uno. Cada destino se puede agregar, quitar
 *     y reordenar; sin destinos el viaje tiene uno solo (el final). No hay tope: ninguna
 *     decisión lo fija.
 *   - Tipo de servicio: el cliente PUEDE elegir entre dos opciones fijas, Local o Foráneo
 *     (instrucción de Product Management, pendiente de registrarse como DEC). Ya no sale
 *     del catálogo `tipos-servicio`: los códigos `local` y `foraneo` los define esta
 *     pantalla y se envían tal cual en `tipo_servicio`. Su obligatoriedad NO está
 *     decidida, así que NO se fuerza en ninguna dirección.
 *   - Fecha y hora del servicio: OBLIGATORIAS. Se capturan en dos campos, Fecha y Hora, y
 *     se envían como UNO solo: `fecha_hora_servicio`, un instante en UTC (RFC 3339). Si
 *     falta cualquiera, o la fecha no es real, el envío queda bloqueado y el motivo se ve
 *     junto al campo (ver `fechaHora.ts`). No se rechazan fechas pasadas: ninguna HU lo
 *     define. OJO: E1-HU-001 y DEC-010 #2 siguen diciendo que son opcionales para el
 *     cliente (operación las fija antes de aprobar); esta obligatoriedad es una
 *     instrucción nueva de Product Management, pendiente de registrarse como DEC.
 *   - El cliente/tenant NO se captura: lo deriva la identidad en el `bff` (DEC-010 #5).
 *
 * BRECHA CONTRACTUAL — escolta: el formulario captura el tipo de escolta (Patrulla o Moto)
 * y, con el interruptor "Agregar sobreescolta", el tipo de la sobreescolta. Hoy
 * `CrearViajeEntrada` NO tiene campos para esto, así que se muestran en la vista previa
 * pero NO se envían (no se inventa wire). Cuando el contrato los publique, se agregan a
 * `entrada` en `onSubmit`. Los valores `patrulla`/`moto` coinciden con `tipo` de la unidad
 * del roster (ADR 31). El tipo de escolta es OBLIGATORIO (instrucción de Product
 * Management, pendiente de registrarse como DEC): sin él no se envía, aunque hoy el dato
 * no viaje al backend. La sobreescolta es opcional; si se activa, se exige su tipo (igual
 * que un destino abierto exige su nombre) para no enviar un interruptor encendido sin
 * contenido.
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
import { Button, Card, CardBody, FormField, Input, Select, Switch } from '@ai27-tech/ui';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { crearViaje } from '@/lib/api/viajes';
import type { CrearViajeEntrada } from '@/lib/contracts';
import { isApiError } from '@/lib/api/errors';
import { onCut } from '@/lib/api/sessionCut';
import { DestinosIntermedios } from './DestinosIntermedios';
import { resolverFechaHora } from './fechaHora';
import { moverElemento, nuevoDestinoIntermedio, type DestinoIntermedio } from './ordenDestinos';
import { SolicitudVistaPrevia } from './SolicitudVistaPrevia';

/** Tipo de servicio: dos opciones fijas. El `value` es el código que viaja en `tipo_servicio`. */
type TipoServicio = 'local' | 'foraneo';

const OPCIONES_TIPO_SERVICIO: readonly { readonly value: TipoServicio; readonly label: string }[] =
  [
    { value: 'local', label: 'Local' },
    { value: 'foraneo', label: 'Foráneo' },
  ];

/** Valor del `Select` → tipo de servicio, o '' si no se eligió ninguno. */
function aTipoServicio(valor: string | number): TipoServicio | '' {
  return OPCIONES_TIPO_SERVICIO.find((opcion) => opcion.value === valor)?.value ?? '';
}

/** Tipo de vehículo de la escolta. Coincide con `tipo` de la unidad del roster (ADR 31). */
type TipoEscolta = 'patrulla' | 'moto';

const OPCIONES_ESCOLTA: readonly { readonly value: TipoEscolta; readonly label: string }[] = [
  { value: 'patrulla', label: 'Patrulla' },
  { value: 'moto', label: 'Moto' },
];

/** Valor del `Select` → tipo de escolta, o '' si no se eligió ninguno. */
function aTipoEscolta(valor: string | number): TipoEscolta | '' {
  return OPCIONES_ESCOLTA.find((opcion) => opcion.value === valor)?.value ?? '';
}

function etiquetaEscolta(tipo: TipoEscolta | ''): string {
  return OPCIONES_ESCOLTA.find((opcion) => opcion.value === tipo)?.label ?? '';
}

const ICONO_UBICACION = <MapPin aria-hidden="true" className="size-4" />;

/** El botón de envío vive fuera del <form> (bajo la vista previa) y se asocia por este id. */
const ID_FORMULARIO = 'form-nueva-solicitud';

export function NuevaSolicitudForm() {
  const navigate = useNavigate();

  const [origen, setOrigen] = useState('');
  // Destinos intermedios, en orden. Vacío = sin ellos (el interruptor va apagado).
  const [paradas, setParadas] = useState<readonly DestinoIntermedio[]>([]);
  // El destino final: siempre existe y siempre es el último punto de la ruta.
  const [destino, setDestino] = useState('');
  const [tipoServicio, setTipoServicio] = useState<TipoServicio | ''>('');
  // Escolta: hoy solo se captura y se muestra; el contrato aún no la acepta (ver cabecera).
  const [tipoEscolta, setTipoEscolta] = useState<TipoEscolta | ''>('');
  const [conSobreescolta, setConSobreescolta] = useState(false);
  const [tipoSobreescolta, setTipoSobreescolta] = useState<TipoEscolta | ''>('');
  // Fecha (`YYYY-MM-DD`) y hora (`HH:mm`) son dos campos; se combinan al enviar.
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creado, setCreado] = useState<{ id: string } | null>(null);
  const [avisoSesionFinalizada, setAvisoSesionFinalizada] = useState(false);

  useEffect(() => onCut(() => setAvisoSesionFinalizada(true)), []);

  // El interruptor está activo exactamente cuando hay al menos un destino intermedio.
  const conParadas = paradas.length > 0;

  function actualizarParada(indice: number, nombre: string): void {
    setParadas((prev) => prev.map((p, i) => (i === indice ? { ...p, nombre } : p)));
  }

  function agregarParada(): void {
    setParadas((prev) => [...prev, nuevoDestinoIntermedio()]);
  }

  function quitarParada(indice: number): void {
    // Al quitar el último destino, la ruta vuelve a ser origen → destino final.
    setParadas((prev) => prev.filter((_, i) => i !== indice));
  }

  function moverParada(desde: number, hasta: number): void {
    setParadas((prev) => moverElemento(prev, desde, hasta));
  }

  function alternarParadas(activo: boolean): void {
    // Activar abre el primer destino; desactivar descarta todos.
    setParadas(activo ? [nuevoDestinoIntermedio()] : []);
  }

  function alternarSobreescolta(activo: boolean): void {
    setConSobreescolta(activo);
    // Apagar el interruptor descarta el tipo elegido.
    if (!activo) setTipoSobreescolta('');
  }

  // Fecha y hora son obligatorias y van juntas: el contrato solo acepta un instante
  // completo (`fecha_hora_servicio`). Si falta una, o la fecha es irreal, no se envía.
  const fechaHora = resolverFechaHora(fecha, hora);
  const errorFecha =
    fechaHora.estado === 'invalido'
      ? 'Escribe una fecha válida: el año debe tener 4 dígitos.'
      : fechaHora.estado === 'incompleto' && fechaHora.falta === 'fecha'
        ? 'Indica también la fecha.'
        : undefined;
  const errorHora =
    fechaHora.estado === 'incompleto' && fechaHora.falta === 'hora'
      ? 'Indica también la hora.'
      : undefined;
  const fechaHoraCompleta = fechaHora.estado === 'valido';

  // Origen, destino final, todos los destinos, tipo de escolta, fecha y hora completas y,
  // si se pidió sobreescolta, su tipo gobiernan el envío.
  const puedeEnviar =
    origen.trim() !== '' &&
    destino.trim() !== '' &&
    paradas.every((p) => p.nombre.trim() !== '') &&
    tipoEscolta !== '' &&
    fechaHoraCompleta &&
    (!conSobreescolta || tipoSobreescolta !== '');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    // Anti-doble-clic: mientras una creación está en vuelo, no se reenvía.
    if (pending) return;
    // Cinturón además del botón deshabilitado: si falta origen o destino, no se crea.
    if (!puedeEnviar) return;

    setError(null);
    setPending(true);

    try {
      // Solo los campos del contrato; los opcionales se omiten vacíos. `numero_envio` no se
      // captura: no va en ningún destino.
      // Los destinos van primero, en su orden actual, y el destino final al último.
      // La escolta no se envía: el contrato aún no la modela (ver cabecera).
      // `fecha_hora_servicio` es el instante en UTC (RFC 3339) que arma `resolverFechaHora`.
      // Todo el armado vive dentro del `try` para que ningún fallo deje `pending` activo.
      const entrada: CrearViajeEntrada = {
        origen: origen.trim(),
        destinos: [...paradas.map((p) => p.nombre), destino].map((nombre) => ({
          nombre: nombre.trim(),
        })),
        ...(tipoServicio !== '' ? { tipo_servicio: tipoServicio } : {}),
        ...(fechaHora.estado === 'valido' ? { fecha_hora_servicio: fechaHora.iso } : {}),
      };

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
    setParadas([]);
    setDestino('');
    setTipoServicio('');
    setTipoEscolta('');
    setConSobreescolta(false);
    setTipoSobreescolta('');
    setFecha('');
    setHora('');
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

  const etiquetaTipoServicio = OPCIONES_TIPO_SERVICIO.find(
    (opcion) => opcion.value === tipoServicio,
  )?.label;

  return (
    <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card variant="outlined" padding="lg" className="w-full">
        <CardBody>
          {avisoSesionFinalizada && (
            <p role="alert" className="text-error mb-4 text-sm">
              Tu sesión finalizó. La información capturada no se envió.
            </p>
          )}
          <form
            id={ID_FORMULARIO}
            onSubmit={(event) => void onSubmit(event)}
            className="flex flex-col gap-5"
            noValidate
          >
            <FormField label="Origen" required>
              <Input
                value={origen}
                onChange={(event) => setOrigen(event.target.value)}
                placeholder="Ciudad o sitio de origen"
                startAdornment={ICONO_UBICACION}
                required
              />
            </FormField>

            {conParadas && (
              <div className="border-outline-variant flex flex-col gap-4 rounded-lg border p-4">
                <p className="text-on-surface-variant text-xs">
                  Agrega destinos intermedios entre el origen y el destino final.
                </p>

                <DestinosIntermedios
                  destinos={paradas}
                  onActualizar={actualizarParada}
                  onQuitar={quitarParada}
                  onMover={moverParada}
                />

                <Button type="button" variant="outline" onClick={agregarParada}>
                  Agregar otro destino
                </Button>
              </div>
            )}
            <div className="relative flex flex-col">
              <FormField label="Destino final" required>
                <Input
                  value={destino}
                  onChange={(event) => setDestino(event.target.value)}
                  placeholder="Ciudad o sitio del destino final"
                  startAdornment={ICONO_UBICACION}
                  required
                />
              </FormField>
              <div className="pt-2 sm:absolute sm:-top-1 sm:right-0 sm:pt-0">
                <Switch
                  label="Seguimiento con múltiples destinos"
                  checked={conParadas}
                  onChange={(event) => alternarParadas(event.target.checked)}
                />
              </div>
            </div>

            <FormField label="Tipo de servicio">
              <div role="group" aria-label="Tipo de servicio">
                <Select
                  value={tipoServicio}
                  onChange={(valor) => setTipoServicio(aTipoServicio(valor))}
                  options={[{ value: '', label: 'Selecciona un tipo' }, ...OPCIONES_TIPO_SERVICIO]}
                />
              </div>
            </FormField>

            <FormField label="Tipo de escolta" required>
              <div role="group" aria-label="Tipo de escolta">
                <Select
                  value={tipoEscolta}
                  onChange={(valor) => setTipoEscolta(aTipoEscolta(valor))}
                  options={[{ value: '', label: 'Selecciona un tipo' }, ...OPCIONES_ESCOLTA]}
                />
              </div>
            </FormField>

            <div className="flex flex-col gap-4">
              <Switch
                label="Agregar sobreescolta"
                checked={conSobreescolta}
                onChange={(event) => alternarSobreescolta(event.target.checked)}
              />
              {conSobreescolta && (
                <FormField label="Tipo de sobreescolta" required>
                  <div role="group" aria-label="Tipo de sobreescolta">
                    <Select
                      value={tipoSobreescolta}
                      onChange={(valor) => setTipoSobreescolta(aTipoEscolta(valor))}
                      options={[{ value: '', label: 'Selecciona un tipo' }, ...OPCIONES_ESCOLTA]}
                    />
                  </div>
                </FormField>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <FormField label="Fecha del servicio" error={errorFecha} required>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                    max="9999-12-31"
                    required
                    startAdornment={<CalendarDays aria-hidden="true" className="size-4" />}
                  />
                </FormField>
                <FormField label="Hora del servicio" error={errorHora} required>
                  <Input
                    type="time"
                    value={hora}
                    onChange={(event) => setHora(event.target.value)}
                    required
                    startAdornment={<Clock aria-hidden="true" className="size-4" />}
                  />
                </FormField>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>

      {/*
        Columna derecha: la vista previa y, debajo, el botón de envío y su error. El botón
        está fuera del <form> y lo envía por el atributo `form`; la tecla Enter en un campo
        también lo dispara porque es el botón de envío asociado al formulario.
      */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6">
        <SolicitudVistaPrevia
          origen={origen}
          paradas={paradas.map((p) => p.nombre)}
          destino={destino}
          tipoServicio={etiquetaTipoServicio ?? ''}
          tipoEscolta={etiquetaEscolta(tipoEscolta)}
          sobreescolta={conSobreescolta ? etiquetaEscolta(tipoSobreescolta) : 'No'}
          fechaHora={fechaHora.estado === 'valido' ? fechaHora.iso : ''}
        />

        {error !== null && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}

        <Button
          type="submit"
          form={ID_FORMULARIO}
          loading={pending}
          disabled={!puedeEnviar}
          fullWidth
        >
          {pending ? 'Enviando' : 'Solicitar servicio'}
        </Button>
      </div>
    </div>
  );
}
