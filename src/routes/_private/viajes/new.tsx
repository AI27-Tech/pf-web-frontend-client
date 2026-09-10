import { createFileRoute } from '@tanstack/react-router';
import { ViajeRequestSection } from '@/features/viajes/ViajeRequestSection';

export const Route = createFileRoute('/_private/viajes/new')({
  component: NuevoViajePage,
});

function NuevoViajePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Solicitar servicio</h1>
      <p className="text-sm text-slate-600">
        La solicitud entra en estado SOLICITADO y la operacion la toma desde ahi.
      </p>
      <ViajeRequestSection />
    </div>
  );
}
