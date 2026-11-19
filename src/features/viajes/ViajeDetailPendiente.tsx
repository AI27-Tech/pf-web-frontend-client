/*
 * ViajeDetailPendiente: el detalle del viaje mientras llega la primera lectura.
 *
 * Reproduce la forma de `ViajeDetailSection` con esqueletos de `@ai27-tech/ui`
 * (`Timeline loading`, `SkeletonCard`) para que la pantalla no cambie de forma al llegar los
 * datos. El título y la ruta de navegación sí se conocen: salen del `viajeId` de la URL.
 */

import { MessageSquare } from 'lucide-react';
import {
  Breadcrumb,
  Card,
  CardBody,
  PageHeader,
  SkeletonCard,
  Stack,
  Timeline,
} from '@ai27-tech/ui';
import { useBreadcrumbLinks } from '@/app/shell/useBreadcrumbLinks';
import type { EstadoViaje } from '@/lib/contracts';
import { PanelLateral } from '@/app/shell/PanelLateral';
import { CLASE_CONTENEDOR_DETALLE, CLASE_REJILLA_DETALLE } from './detalleLayout';

export function ViajeDetailPendiente({
  viajeId,
  estadoHistorial,
}: {
  readonly viajeId: string;
  readonly estadoHistorial?: EstadoViaje | undefined;
}) {
  const { historial } = useBreadcrumbLinks();

  return (
    <Stack gap={4} className={CLASE_CONTENEDOR_DETALLE}>
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[historial(estadoHistorial), { label: `Viaje ${viajeId}` }]} />
        }
        title={`Viaje ${viajeId}`}
      />
      <div className={CLASE_REJILLA_DETALLE}>
        <Stack gap={4}>
          <Card variant="outlined" padding="lg">
            <CardBody>
              <Timeline
                aria-label="Cargando el progreso del viaje"
                orientation="horizontal"
                stackBelow={480}
                items={[]}
                loading
              />
            </CardBody>
          </Card>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </Stack>
        <Stack gap={4}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
        </Stack>
      </div>

      <PanelLateral title="Conversación" icon={MessageSquare}>
        <SkeletonCard lines={8} />
      </PanelLateral>
    </Stack>
  );
}
