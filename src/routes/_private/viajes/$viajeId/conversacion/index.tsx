import { createFileRoute } from '@tanstack/react-router';
import { ConversacionSection } from '@/features/conversacion/ConversacionSection';

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
  component: ConversacionPage,
});

function ConversacionPage() {
  const { viajeId } = Route.useParams();
  return <ConversacionSection viajeId={viajeId} />;
}
