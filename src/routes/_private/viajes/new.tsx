/*
 * Solicitar nuevo servicio — versión mínima apegada al contrato (E8-T3).
 *
 * El contrato `CrearViajeEntrada` acepta pocos campos; esta pantalla captura solo esos
 * y crea un viaje real. El asistente de 4 pasos se conservó en src/_desconectado/solicitud/
 * para reconectar cuando el contrato soporte sus campos.
 */

import { createFileRoute } from '@tanstack/react-router';
import { PageHeader, Stack } from '@ai27-tech/ui';
import { NuevaSolicitudForm } from '@/features/viajes/NuevaSolicitudForm';

export const Route = createFileRoute('/_private/viajes/new')({
  /*
   * Sin loader: el tipo de servicio son dos opciones fijas (Local y Foráneo) que define
   * el propio formulario, así que la pantalla ya no consulta ningún catálogo. Origen y
   * destino tampoco dependen de uno (DEC-010 #1).
   */
  component: NuevoViajePage,
});

function NuevoViajePage() {
  return (
    <Stack gap={6} className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Solicitar nuevo servicio"
        description="Indica el origen, el destino y el tipo de servicio para crear una solicitud."
      />
      <NuevaSolicitudForm />
    </Stack>
  );
}
