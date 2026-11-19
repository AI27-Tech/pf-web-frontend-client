/*
 * ConversacionPanel — la conversación de UN viaje, como contenido del panel lateral del
 * shell (E9-T8 / E3-HU-014, AI27-27). Solo existe en el detalle del viaje: carga únicamente
 * los mensajes de ese viaje. El panel (columna fija a la derecha, con su título y su botón de
 * cierre) lo monta y lo oculta `ViajeDetailSection`; al ocultarse, este componente se
 * desmonta (deja de consultar) y al mostrarse retoma la historia de la caché.
 */

import { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Alert,
  ConversationStatus,
  EmptyState,
  MessageComposer,
  MessageThread,
  Stack,
  type EnviarMensajeEntrada,
  type MensajePendiente,
} from '@ai27-tech/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { isApiError } from '@/lib/api/errors';
import { aMensajeLibreria, esMensajePropio, razonSoloLectura } from './mensajeria';
import { useConversacion } from './useConversacion';

/** Un envío en curso o fallido: lo que se pinta como mensaje pendiente. */
interface Intento {
  readonly envio: EnviarMensajeEntrada;
  readonly creadoEn: string;
}

export function ConversacionPanel({ viajeId }: { readonly viajeId: string }) {
  const { conversacion, mensajes, enviar, cargarMasAntiguos } = useConversacion(viajeId);

  const [borrador, setBorrador] = useState('');
  const [intento, setIntento] = useState<Intento | null>(null);
  // `hayMas` arranca indefinido: tras la primera carga, si el servidor dijo que hay más
  // historia hacia atrás, se ofrece "Cargar mensajes anteriores". Al agotarse, se oculta.
  const [hayMas, setHayMas] = useState<boolean | undefined>(undefined);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);

  const lista = useMemo(
    () => (mensajes.data ?? []).map((mensaje) => aMensajeLibreria(mensaje, viajeId)),
    [mensajes.data, viajeId],
  );

  const errorDeCarga = conversacion.error ?? mensajes.error;
  // El bff responde 404 cuando el viaje no tiene conversación.
  const sinConversacion = isApiError(errorDeCarga) && errorDeCarga.kind === 'noEncontrado';

  // Un 409 con `codigo` de máquina `conversacion_solo_lectura` significa que la conversación
  // se volvió solo lectura entre que se cargó y se intentó enviar.
  const soloLecturaServidor =
    isApiError(enviar.error) &&
    enviar.error.status === 409 &&
    (enviar.error.detail?.includes('conversacion_solo_lectura') ?? true);

  function enviarEntrada(envio: EnviarMensajeEntrada): void {
    setIntento({ envio, creadoEn: new Date().toISOString() });
    setBorrador('');
    // El mensaje confirmado ya se fusionó en la caché (hook); aquí solo se retira el pendiente.
    enviar.mutate(envio, { onSuccess: () => setIntento(null) });
  }

  const pendientes: MensajePendiente[] =
    intento === null || soloLecturaServidor
      ? []
      : [
          {
            clientMessageId: intento.envio.clientMessageId,
            cuerpo: intento.envio.cuerpo,
            creadoEn: intento.creadoEn,
            deliveryStatus: enviar.isError ? 'failed' : 'sending',
            ...(enviar.isError
              ? {
                  // Mismo `client_message_id`: reintentar no duplica.
                  onRetry: () =>
                    enviar.mutate(intento.envio, { onSuccess: () => setIntento(null) }),
                }
              : {}),
          },
        ];

  async function cargarAnteriores(): Promise<void> {
    setCargandoAnteriores(true);
    try {
      setHayMas(await cargarMasAntiguos());
    } finally {
      setCargandoAnteriores(false);
    }
  }

  const estado = conversacion.data?.estado;
  const razon = estado !== undefined ? razonSoloLectura(estado) : null;

  // Un solo aviso a la vez, por prioridad: carga fallida, ventana cerrada al enviar, razón.
  let aviso = null;
  if (sinConversacion) {
    aviso = <Alert variant="info">Este viaje todavía no tiene una conversación.</Alert>;
  } else if (errorDeCarga !== null) {
    aviso = (
      <ErrorState
        error={errorDeCarga}
        onRetry={() => {
          void conversacion.refetch();
          void mensajes.refetch();
        }}
      />
    );
  } else if (soloLecturaServidor) {
    aviso = (
      <Alert variant="warning">
        Esta conversación ya no admite mensajes: la ventana de escritura se cerró.
      </Alert>
    );
  } else if (razon !== null) {
    aviso = <Alert variant="info">{razon}</Alert>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {(conversacion.data !== undefined || aviso !== null) && (
        <Stack gap={3} className="shrink-0">
          {conversacion.data !== undefined && (
            <ConversationStatus
              estado={conversacion.data.estado}
              atendida={conversacion.data.atendida === true}
            />
          )}
          {aviso}
        </Stack>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageThread
          mensajes={lista}
          isOwn={esMensajePropio}
          pendientes={pendientes}
          loading={conversacion.isPending || mensajes.isPending}
          hayMas={hayMas !== false && lista.length > 0}
          onCargarAnteriores={() => void cargarAnteriores()}
          loadingPrevious={cargandoAnteriores}
          emptyState={
            errorDeCarga !== null ? (
              <></>
            ) : (
              <EmptyState size="sm" icon={<MessageSquare />} title="Sin mensajes todavía" />
            )
          }
        />
        <MessageComposer
          value={borrador}
          onChange={setBorrador}
          onSend={enviarEntrada}
          sending={enviar.isPending}
          disabled={conversacion.data === undefined}
          {...(estado !== undefined ? { estadoConversacion: estado } : {})}
        />
      </div>
    </div>
  );
}
