/*
 * ConversacionSection — conversación del viaje para el cliente (E9-T8 / E3-HU-014).
 *
 * Carril de audiencia Cliente (DEC-021/DEC-014): el cliente lee y escribe mensajes de SU
 * viaje. Las respuestas de AI27 (`de_cliente=false`) se pintan SIEMPRE con la etiqueta
 * constante "AI27 Operations": el frontend nunca recibe —ni muestra— el actor real ni el
 * rol interno. La conversación muestra su indicador `atendida` (atendido/resuelto), no
 * recibos de lectura individuales.
 *
 * El componente es dueño de su estado de servidor a través de `useConversacion`: trae la
 * metadata y la historia por polling (sin SSE en V1) y envía con una mutación idempotente.
 * La historia llega YA ordenada y deduplicada por secuencia de dominio desde el hook;
 * este componente no reordena y, sobre todo, no ordena por `enviadoEn`: dos mensajes del
 * mismo segundo de reloj tienen orden canónico y es el de dominio.
 *
 * Estados cubiertos: vacía · con historial (paginación por secuencia, `hay_mas`) ·
 * enviando (optimista, sin duplicar por reintento) · solo lectura/cerrada (envío
 * deshabilitado con la razón; 409 `conversacion_solo_lectura` si llega) · atendida ·
 * error de carga.
 */

import { useState, type FormEvent } from 'react';
import { Badge, Button, FormField, Input } from '@ai27-tech/ui';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { isApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/utils';
import type { ConversacionCliente } from '@/lib/contracts';
import { useConversacion } from './useConversacion';

/** Etiqueta constante con la que AI27 se presenta al cliente (DEC-021 #4). */
const ETIQUETA_AI27 = 'AI27 Operations';

/** Texto de por qué la conversación no admite escritura, según su estado de ciclo de vida. */
function razonSoloLectura(estado: ConversacionCliente['estado']): string | null {
  switch (estado) {
    case 'abierta':
      return null;
    case 'solo_lectura':
      return 'Esta conversación es de solo lectura: la ventana para escribir se cerró.';
    case 'cerrada':
      return 'Esta conversación está cerrada.';
  }
}

export function ConversacionSection({ viajeId }: { readonly viajeId: string }) {
  const { conversacion, mensajes, enviar, cargarMasAntiguos, puedeEscribir } =
    useConversacion(viajeId);

  // La metadata es la puerta: sin ella no sabemos el estado ni si está atendida.
  if (conversacion.isPending) return <Spinner label="Cargando conversación" />;
  if (conversacion.isError) {
    return <ErrorState error={conversacion.error} onRetry={() => void conversacion.refetch()} />;
  }

  const razon = razonSoloLectura(conversacion.data.estado);

  return (
    <section aria-labelledby="conversacion-titulo" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="conversacion-titulo" className="text-on-surface text-lg font-semibold">
          Conversación
        </h2>
        {/* Indicador atendido/resuelto (DEC-014): el cliente ve el agregado, no recibos. */}
        {conversacion.data.atendida === true && (
          <Badge variant="secure" pill>
            Atendida
          </Badge>
        )}
      </header>

      <HistorialMensajes
        viajeId={viajeId}
        mensajes={mensajes}
        cargarMasAntiguos={cargarMasAntiguos}
      />

      {razon !== null ? (
        <p
          role="status"
          className="text-on-surface-variant bg-surface-container rounded-md px-3 py-2 text-sm"
        >
          {razon}
        </p>
      ) : (
        <MensajeComposer
          onEnviar={(cuerpo) => enviar.mutate(cuerpo)}
          enviando={enviar.isPending}
          errorEnvio={enviar.isError ? enviar.error : null}
          puedeEscribir={puedeEscribir}
        />
      )}
    </section>
  );
}

function HistorialMensajes({
  mensajes,
  cargarMasAntiguos,
}: {
  readonly viajeId: string;
  readonly mensajes: ReturnType<typeof useConversacion>['mensajes'];
  readonly cargarMasAntiguos: () => Promise<boolean>;
}) {
  // `hayMas` arranca indefinido: tras la primera carga, si el servidor dijo que hay más
  // historia hacia atrás, se ofrece el botón "Cargar anteriores". Al agotarse, se oculta.
  const [hayMas, setHayMas] = useState<boolean | undefined>(undefined);
  const [cargandoAntiguos, setCargandoAntiguos] = useState(false);

  async function onCargarMas(): Promise<void> {
    setCargandoAntiguos(true);
    try {
      setHayMas(await cargarMasAntiguos());
    } finally {
      setCargandoAntiguos(false);
    }
  }

  if (mensajes.isPending) return <Spinner label="Cargando mensajes" />;
  if (mensajes.isError) {
    return <ErrorState error={mensajes.error} onRetry={() => void mensajes.refetch()} />;
  }

  const lista = mensajes.data;

  if (lista.length === 0) {
    return <EmptyState title="Sin mensajes todavía" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {hayMas !== false && (
        <div className="self-center">
          <Button variant="ghost" onClick={() => void onCargarMas()} loading={cargandoAntiguos}>
            Cargar mensajes anteriores
          </Button>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {lista.map((mensaje) => (
          <li
            key={mensaje.id}
            className={
              mensaje.deCliente
                ? 'bg-brand-50 text-on-surface ml-auto max-w-[80%] rounded-lg px-3 py-2'
                : 'bg-surface-container-lowest border-outline-variant text-on-surface max-w-[80%] rounded-lg border px-3 py-2'
            }
          >
            {/* AI27 se presenta SIEMPRE con la etiqueta constante; nunca el actor real. */}
            {!mensaje.deCliente && (
              <p className="text-on-surface-variant mb-1 text-xs font-semibold">{ETIQUETA_AI27}</p>
            )}
            <p className="text-sm">{mensaje.cuerpo}</p>
            <p className="text-on-surface-variant mt-1 text-xs">
              {formatDateTime(mensaje.enviadoEn)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MensajeComposer({
  onEnviar,
  enviando,
  errorEnvio,
  puedeEscribir,
}: {
  readonly onEnviar: (cuerpo: string) => void;
  readonly enviando: boolean;
  readonly errorEnvio: unknown;
  readonly puedeEscribir: boolean;
}) {
  const [cuerpo, setCuerpo] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const texto = cuerpo.trim();
    if (texto.length === 0) return;
    onEnviar(texto);
    // Limpieza optimista: el hook fusiona el mensaje confirmado por secuencia (dedup).
    setCuerpo('');
  }

  // Un 409 con `codigo` de máquina `conversacion_solo_lectura` significa que la
  // conversación se volvió solo lectura entre que se cargó y se intentó enviar: se
  // explica en vez de presentarlo como un fallo genérico. Se ramifica sobre el `codigo`
  // estable (que viaja en el cuerpo del error, capturado en `detail`), no sobre el
  // mensaje: el contrato promete ese código, no un texto concreto.
  const soloLecturaServidor =
    isApiError(errorEnvio) &&
    errorEnvio.status === 409 &&
    (errorEnvio.detail?.includes('conversacion_solo_lectura') ?? true);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <FormField label="Nuevo mensaje">
        <Input
          value={cuerpo}
          onChange={(event) => setCuerpo(event.target.value)}
          disabled={!puedeEscribir}
          aria-label="Nuevo mensaje"
        />
      </FormField>

      {soloLecturaServidor ? (
        <p role="alert" className="text-on-surface-variant text-sm">
          Esta conversación ya no admite mensajes: la ventana de escritura se cerró.
        </p>
      ) : (
        errorEnvio !== null && <ErrorState error={errorEnvio} />
      )}

      <div>
        <Button type="submit" loading={enviando} disabled={!puedeEscribir || cuerpo.trim() === ''}>
          Enviar
        </Button>
      </div>
    </form>
  );
}
