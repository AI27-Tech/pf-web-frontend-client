/*
 * Solicitar nuevo servicio — versión mínima apegada al contrato (E8-T3).
 *
 * El contrato `CrearViajeEntrada` acepta pocos campos; esta pantalla captura solo esos
 * y crea un viaje real. El asistente de 4 pasos se conservó en src/_desconectado/solicitud/
 * para reconectar cuando el contrato soporte sus campos.
 */

import { createFileRoute } from '@tanstack/react-router';
import type { OpcionCatalogo } from '@/lib/contracts';
import { listCatalogo } from '@/lib/api/catalogos';
import { NuevaSolicitudForm } from '@/features/viajes/NuevaSolicitudForm';
import { Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/new')({
  /*
   * El único catálogo que esta pantalla consume es el tipo de servicio (DEC-010 #3:
   * el cliente PUEDE elegirlo). Es un dato de PRESENTACIÓN, opcional y no bloqueante:
   * si `bff`/`catalogos` no responde, el alta sigue siendo usable con el campo en
   * texto libre o vacío. Por eso el loader DEGRADA a lista vacía en vez de tirar la
   * pantalla al `errorComponent`. Origen y destino (los campos obligatorios) no
   * dependen de ningún catálogo (DEC-010 #1).
   */
  loader: async (): Promise<readonly OpcionCatalogo[]> => {
    try {
      return await listCatalogo('tipos-servicio');
    } catch {
      return [];
    }
  },
  component: NuevoViajePage,
  pendingComponent: () => <Spinner label="Preparando el formulario" />,
});

function NuevoViajePage() {
  const tiposServicio = Route.useLoaderData();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Solicitar nuevo servicio</h1>
        <p className="text-on-surface-variant text-sm">
          Indica el origen, el destino y el tipo de servicio para crear una solicitud.
        </p>
      </header>
      <NuevaSolicitudForm tiposServicio={tiposServicio} />
    </div>
  );
}
