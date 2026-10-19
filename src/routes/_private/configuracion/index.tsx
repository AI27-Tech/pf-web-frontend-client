/*
 * Pagina temporal. Placeholder hasta que se implemente Configuracion.
 */

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/configuracion/')({
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Configuración</h1>
      <p className="text-on-surface-variant text-sm">Esta seccion esta en construccion.</p>
    </div>
  );
}
