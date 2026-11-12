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
 * Disposición: encabezado con línea divisoria, historial con burbujas (las de AI27 a la
 * izquierda con su etiqueta arriba; las del cliente a la derecha) y una barra de envío
 * inferior con el campo y el botón en una fila.
 *
 * Mensajes MULTILÍNEA, solo texto plano: el campo es un `Textarea` que crece con el
 * texto (Enter envía, Shift+Enter inserta un salto) y las burbujas respetan los saltos
 * (`whitespace-pre-wrap`). Los saltos viajan como `\n` dentro de `cuerpo`; no hay otro
 * formato (negritas, listas) ni cambio de contrato. El front interno debe pintar `\n`
 * igual para que ambos lados vean el mismo mensaje.
 *
 * Estados cubiertos: vacía · con historial (paginación por secuencia, `hay_mas`) ·
 * enviando (optimista, sin duplicar por reintento) · solo lectura/cerrada (envío
 * deshabilitado con la razón; 409 `conversacion_solo_lectura` si llega) · atendida ·
 * error de carga.
 */

import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from 'react';
import { Badge, Button, Textarea } from '@ai27-tech/ui';
import { RotateCw } from 'lucide-react';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { isApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/utils';
import type { ConversacionCliente } from '@/lib/contracts';
import { useConversacion } from './useConversacion';

/** Alto máximo del campo de mensaje (≈ 6 líneas); pasado este tope scrollea por dentro. */
const ALTO_MAXIMO_CAMPO_PX = 144;

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
    <section aria-labelledby="conversacion-titulo" className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="border-outline-variant -mx-4 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 pb-4">
        <div className="flex flex-col gap-0.5">
          <h2 id="conversacion-titulo" className="text-on-surface text-lg font-semibold">
            Conversación
          </h2>
          <p className="text-on-surface-variant text-sm">Viaje {viajeId}</p>
        </div>
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

      <div className="border-outline-variant -mx-4 shrink-0 border-t px-4 py-3">
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
      </div>
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

  /*
   * Scroll interno. El área de mensajes es la que scrollea y los mensajes se anclan al
   * FONDO: el más nuevo queda abajo, junto al compositor, y la historia crece hacia
   * arriba.
   *   - Al abrir, se posiciona en el último mensaje.
   *   - Llega un mensaje nuevo (polling o envío propio): baja solo si el lector ya estaba
   *     al fondo, o si el mensaje es suyo. Si estaba leyendo historia, no se le mueve.
   *   - "Cargar mensajes anteriores" agrega arriba: se compensa la altura añadida para
   *     que lo que estaba leyendo no salte.
   */
  const contenedor = useRef<HTMLDivElement>(null);
  const alFondo = useRef(true);
  const posicionado = useRef(false);
  const antesDeCargar = useRef<{ alto: number; arriba: number } | null>(null);

  const datos = mensajes.data;
  const ultimo = datos?.[datos.length - 1];
  const primeroId = datos?.[0]?.id;
  const ultimoId = ultimo?.id;
  const ultimoEsDelCliente = ultimo?.deCliente === true;

  // Mensaje nuevo al final.
  useLayoutEffect(() => {
    const el = contenedor.current;
    if (el === null || ultimoId === undefined) return;
    if (!posicionado.current || alFondo.current || ultimoEsDelCliente) {
      el.scrollTop = el.scrollHeight;
      alFondo.current = true;
    }
    posicionado.current = true;
  }, [ultimoId, ultimoEsDelCliente]);

  useLayoutEffect(() => {
    const el = contenedor.current;
    const previo = antesDeCargar.current;
    if (el === null || previo === null) return;
    el.scrollTop = el.scrollHeight - previo.alto + previo.arriba;
    antesDeCargar.current = null;
  }, [primeroId]);

  function onScroll(evento: UIEvent<HTMLDivElement>): void {
    const el = evento.currentTarget;
    alFondo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function onCargarMas(): Promise<void> {
    const el = contenedor.current;
    if (el !== null) antesDeCargar.current = { alto: el.scrollHeight, arriba: el.scrollTop };
    setCargandoAntiguos(true);
    try {
      setHayMas(await cargarMasAntiguos());
    } finally {
      // La compensación de scroll NO se limpia aquí: el render con la historia nueva
      // ocurre después de esta línea y el efecto de `primeroId` es quien la consume.
      setCargandoAntiguos(false);
    }
  }

  function area(contenido: ReactNode, ancladoAlFondo = false): ReactNode {
    return (
      <div
        ref={contenedor}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {ancladoAlFondo ? (
          <div className="flex min-h-full flex-col justify-end gap-3">{contenido}</div>
        ) : (
          contenido
        )}
      </div>
    );
  }

  if (mensajes.isPending) return area(<Spinner label="Cargando mensajes" />);
  if (mensajes.isError) {
    return area(<ErrorState error={mensajes.error} onRetry={() => void mensajes.refetch()} />);
  }

  const lista = mensajes.data;

  if (lista.length === 0) {
    return area(<EmptyState title="Sin mensajes todavía" />);
  }

  return area(
    <>
      {hayMas !== false && (
        <div className="self-center">
          <Button
            variant="outline"
            size="sm"
            startIcon={<RotateCw aria-hidden="true" className="size-3.5" />}
            onClick={() => void onCargarMas()}
            loading={cargandoAntiguos}
          >
            Cargar mensajes anteriores
          </Button>
        </div>
      )}

      <ol className="flex flex-col gap-4">
        {lista.map((mensaje) => (
          <li
            key={mensaje.id}
            className={
              'flex max-w-[80%] min-w-0 flex-col gap-1 ' +
              (mensaje.deCliente ? 'ml-auto items-end' : 'items-start')
            }
          >
            {/* AI27 se presenta SIEMPRE con la etiqueta constante; nunca el actor real. */}
            {!mensaje.deCliente && (
              <p className="text-on-surface-variant px-1 text-xs">{ETIQUETA_AI27}</p>
            )}
            <div
              className={
                'rounded-2xl px-4 py-2 wrap-anywhere ' +
                (mensaje.deCliente
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface border')
              }
            >
              <p className="text-sm whitespace-pre-wrap">{mensaje.cuerpo}</p>
              <p
                className={
                  mensaje.deCliente
                    ? 'text-on-primary mt-1 text-xs'
                    : 'text-on-surface-variant mt-1 text-xs'
                }
              >
                {formatDateTime(mensaje.enviadoEn)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </>,
    true,
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
  const campo = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = campo.current;
    if (el === null) return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) {
      el.style.height = `${Math.min(el.scrollHeight, ALTO_MAXIMO_CAMPO_PX)}px`;
    }
  }, [cuerpo]);

  function enviarSiProcede(): void {
    const texto = cuerpo.trim();
    if (!puedeEscribir || texto.length === 0) return;
    // Solo se recortan los extremos: los saltos de línea del medio viajan en `cuerpo`.
    onEnviar(texto);
    // Limpieza optimista: el hook fusiona el mensaje confirmado por secuencia (dedup).
    setCuerpo('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    enviarSiProcede();
  }

  // Enter envía; Shift+Enter inserta un salto de línea.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    enviarSiProcede();
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
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <Textarea
            textareaRef={campo}
            rows={1}
            value={cuerpo}
            onChange={(event) => setCuerpo(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={!puedeEscribir}
            aria-label="Nuevo mensaje"
            style={{ minHeight: 0, resize: 'none' }}
          />
        </div>
        <Button type="submit" loading={enviando} disabled={!puedeEscribir || cuerpo.trim() === ''}>
          Enviar
        </Button>
      </div>

      {soloLecturaServidor ? (
        <p role="alert" className="text-on-surface-variant text-sm">
          Esta conversación ya no admite mensajes: la ventana de escritura se cerró.
        </p>
      ) : (
        errorEnvio !== null && <ErrorState error={errorEnvio} />
      )}
    </form>
  );
}
