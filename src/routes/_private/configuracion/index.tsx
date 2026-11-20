/*
 * Pagina temporal. Placeholder hasta que se implemente Configuracion.
 */

import { createFileRoute } from '@tanstack/react-router';
import { EmptyState, PageHeader, Stack } from '@ai27-tech/ui';
import { Settings } from 'lucide-react';

export const Route = createFileRoute('/_private/configuracion/')({
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  return (
    <Stack gap={4}>
      <PageHeader title="Configuración" />
      <EmptyState icon={<Settings />} title="Esta sección está en construcción." />
    </Stack>
  );
}
