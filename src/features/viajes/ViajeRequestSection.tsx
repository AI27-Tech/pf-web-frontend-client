/*
 * ViajeRequestSection. Interactiva: es el comando de solicitud de servicio.
 *
 * El viaje entra en SOLICITADO (§C.1), y el estado inicial NO lo manda el cliente:
 * lo decide `operacion`. De ahi que el body no lleve `estado`.
 */

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { solicitarViaje } from '@/lib/api/viajes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/Feedback';

export function ViajeRequestSection() {
  const navigate = useNavigate();
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [requeridoEn, setRequeridoEn] = useState('');
  const [notas, setNotas] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      solicitarViaje({ origen, destino, requeridoEn: new Date(requeridoEn).toISOString(), notas }),
    onSuccess: (created) => {
      void navigate({ to: '/viajes/$viajeId', params: { viajeId: created.id } });
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <Input
        label="Origen"
        value={origen}
        onChange={(event) => setOrigen(event.target.value)}
        required
      />
      <Input
        label="Destino"
        value={destino}
        onChange={(event) => setDestino(event.target.value)}
        required
      />
      <Input
        label="Requerido para"
        type="datetime-local"
        value={requeridoEn}
        onChange={(event) => setRequeridoEn(event.target.value)}
        required
      />
      <Input
        label="Notas"
        value={notas}
        onChange={(event) => setNotas(event.target.value)}
        placeholder="Opcional"
      />

      {mutation.isError && <ErrorState error={mutation.error} />}

      <Button type="submit" pending={mutation.isPending}>
        Solicitar servicio
      </Button>
    </form>
  );
}
