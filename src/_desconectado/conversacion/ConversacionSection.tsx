/*
 * ConversacionSection.
 *
 * La historia llega YA ordenada por secuencia de dominio desde `lib/api/conversaciones`.
 * Este componente no reordena y, sobre todo, no ordena por `enviadoEn`: dos mensajes
 * con el mismo segundo de reloj tienen orden canonico y es el de dominio.
 *
 * El composer es el unico subcomponente con estado, y esta abajo a proposito.
 */

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { findDomainSequenceGaps } from '@/lib/contracts';
import { enviarMensaje, type Mensaje } from './api';
import { Button, FormField, Input } from '@ai27-tech/ui';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';

export function ConversacionSection({
  conversacionId,
  mensajes,
}: {
  readonly conversacionId: string;
  readonly mensajes: readonly Mensaje[];
}) {
  /*
   * Un hueco en la secuencia de dominio NO se cierra con el stream: se cierra por
   * lectura HTTP durable contra mensajeria. Detectarlo sirve para no presentar una
   * conversacion incompleta como si estuviera completa.
   */
  const gaps = findDomainSequenceGaps(mensajes);

  return (
    <div className="flex flex-col gap-4">
      {gaps.length > 0 && (
        <p
          role="status"
          className="bg-degradado-50 text-degradado-800 rounded-md px-3 py-2 text-sm"
        >
          Faltan {gaps.length} mensaje(s) por cargar. Actualiza para completar la conversacion.
        </p>
      )}

      {mensajes.length === 0 ? (
        <EmptyState title="Sin mensajes todavia" />
      ) : (
        <ol className="flex flex-col gap-3">
          {mensajes.map((mensaje) => (
            <li
              key={mensaje.id}
              className={
                mensaje.deCliente
                  ? 'bg-brand-50 text-on-surface ml-auto max-w-[80%] rounded-lg px-3 py-2'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface max-w-[80%] rounded-lg border px-3 py-2'
              }
            >
              <p className="text-sm">{mensaje.cuerpo}</p>
              <p className="text-on-surface-variant mt-1 text-xs">
                {formatDateTime(mensaje.enviadoEn)}
              </p>
            </li>
          ))}
        </ol>
      )}

      <MensajeComposer conversacionId={conversacionId} />
    </div>
  );
}

function MensajeComposer({ conversacionId }: { readonly conversacionId: string }) {
  const [cuerpo, setCuerpo] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    /*
     * La clave de idempotencia se genera por envio, no por render: un reintento de
     * red no debe duplicar el mensaje. El actor y el tenant NO van en el body — se
     * derivan del token en el servidor.
     */
    mutationFn: () => enviarMensaje(conversacionId, cuerpo, crypto.randomUUID()),
    onSuccess: () => {
      setCuerpo('');
      void queryClient.invalidateQueries({ queryKey: ['mensajes', conversacionId] });
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (cuerpo.trim().length === 0) return;
    mutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <FormField label="Nuevo mensaje">
        <Input value={cuerpo} onChange={(event) => setCuerpo(event.target.value)} />
      </FormField>
      {mutation.isError && <ErrorState error={mutation.error} />}
      <div>
        <Button type="submit" loading={mutation.isPending}>
          Enviar
        </Button>
      </div>
    </form>
  );
}
