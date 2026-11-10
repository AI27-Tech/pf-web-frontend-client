import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ConversacionSection } from '@/features/conversacion/ConversacionSection';
import { conservarFiltro, validarFiltroEstado } from '@/features/viajes/filtroEstado';

/*
 * Conversación del viaje (E9-T8 / E3-HU-014, AI27-27).
 *
 * Ruta COLGADA del viaje: la conversación se ancla al viaje, nunca a un `conversacion_id`
 * (el cliente navega por viaje y el servidor resuelve la conversación). A diferencia del
 * detalle (que siembra su lectura inicial en un `loader`), aquí no hay `loader`: el
 * `ConversacionSection` es dueño de su propio estado de servidor vía `useConversacion`
 * (metadata + historia por polling, sin SSE en V1) y maneja sus estados de carga, vacío
 * y error. Así la ruta no duplica la lectura ni decide la cadencia.
 */
export const Route = createFileRoute('/_private/viajes/$viajeId/conversacion/')({
  validateSearch: validarFiltroEstado,
  component: ConversacionPage,
});

function ConversacionPage() {
  const { viajeId } = Route.useParams();
  const { estado } = Route.useSearch();
  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/viajes/$viajeId"
        params={{ viajeId }}
        search={conservarFiltro(estado)}
        className="border-outline-variant text-on-surface hover:bg-surface-container inline-flex items-center gap-2 self-start rounded-md border px-3 py-2 text-sm font-medium"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al viaje
      </Link>
      <ConversacionSection viajeId={viajeId} />
    </div>
  );
}
