/*
 * ViajeDetailSection. Presentacional (salvo el aviso de emergencia, que lee la caché).
 *
 * Reconstruido sobre `ViajeSeguimiento` del contrato `bff` (recorte al contrato): la
 * vista del cliente es CURADA (DEC-006). Muestra el recorrido del viaje, el hito actual,
 * el ETA estimado con su marca de obsolescencia, y las incidencias curadas (categoría +
 * estado + marca de tiempo, y el impacto en el ETA si el contrato lo trae), nunca el
 * tipo interno de incidencia.
 *
 * Estructura: `PageHeader` con la ruta de navegación (`Breadcrumb`), el título, el estado
 * y el acceso a la conversación; y el aviso de emergencia activa (si la hay). Debajo, dos
 * columnas desde `lg`: a la izquierda el seguimiento (recorrido en cuatro pasos, hito y
 * ETA, incidencias) y a la derecha las acciones del cliente (cancelar o rechazar,
 * emergencia). En pantallas angostas se apilan.
 *
 * Lo que el contrato NO expone aquí y por eso no se pinta: origen, destino, tipo de
 * servicio, fecha programada, unidad y operador (el resumen de ruta que traen otros
 * diseños), además de folio, fecha de solicitud y "condiciones activas". Volverán si el
 * contrato los publica. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import { CircleCheck } from 'lucide-react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  EmptyState,
  Inline,
  PageHeader,
  Section,
  Stack,
  Timeline,
  type DescriptionListItem,
} from '@ai27-tech/ui';
import { useBreadcrumbLinks } from '@/app/shell/useBreadcrumbLinks';
import type { EstadoViaje, IncidenciaCurada, ViajeSeguimiento } from '@/lib/contracts';
import { formatDateTime } from '@/lib/utils';
import { CancelarRechazarPanel } from './CancelarRechazarPanel';
import { EmergenciaPanel } from './EmergenciaPanel';
import { EstadoViajeChip } from './EstadoViajeChip';
import { recorridoDelViaje } from './pasosViaje';
import { useEmergencias } from './useEmergencias';

/** Una incidencia curada: en atención se resalta como advertencia; resuelta, en calma. */
function IncidenciaItem({ incidencia }: { readonly incidencia: IncidenciaCurada }) {
  const enAtencion = incidencia.estado === 'en_atencion';
  return (
    <Alert variant={enAtencion ? 'warning' : 'success'} title={incidencia.categoria}>
      <Stack gap={1}>
        <Inline gap={2} align="center">
          <Badge variant={enAtencion ? 'warning' : 'secure'} pill>
            {enAtencion ? 'En atención' : 'Resuelta'}
          </Badge>
          <span>{formatDateTime(incidencia.marca_tiempo)}</span>
        </Inline>
        {incidencia.impacto_eta !== undefined && incidencia.impacto_eta !== null && (
          <span>Impacto en el ETA: {incidencia.impacto_eta}</span>
        )}
      </Stack>
    </Alert>
  );
}

export function ViajeDetailSection({
  viaje,
  estadoHistorial,
}: {
  readonly viaje: ViajeSeguimiento;
  readonly estadoHistorial?: EstadoViaje | undefined;
}) {
  const { hito, eta, incidencias } = viaje;
  const { historial } = useBreadcrumbLinks();
  // Misma clave de caché que usa `EmergenciaPanel`: no es una segunda petición.
  const { consulta: emergencias } = useEmergencias(viaje.id);
  const emergenciaActiva = emergencias.data?.emergencia_activa ?? false;

  const recorrido = recorridoDelViaje(hito.estado);

  // Hito (solo si el contrato trae su etiqueta) y ETA.
  const datos: DescriptionListItem[] = [
    ...(hito.etiqueta !== undefined ? [{ label: 'Hito actual', value: hito.etiqueta }] : []),
    {
      label: 'ETA estimado',
      value:
        eta === undefined || eta === null ? null : (
          <Inline gap={2} align="center">
            {formatDateTime(eta.valor)}
            {eta.obsoleto && (
              <Badge variant="warning" size="sm">
                Obsoleto
              </Badge>
            )}
          </Inline>
        ),
    },
  ];

  return (
    <Stack gap={4}>
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[historial(estadoHistorial), { label: `Viaje ${viaje.id}` }]} />
        }
        title={`Viaje ${viaje.id}`}
        // El estado del hito es un token del enum del contrato (ADR 19).
        actions={<EstadoViajeChip estado={hito.estado as EstadoViaje} />}
      />

      {emergenciaActiva && (
        <Alert variant="danger" title="Hay una emergencia activa en este viaje." />
      )}

      {/*
        Dos columnas desde `lg`: a la izquierda el seguimiento (recorrido, hito, ETA e
        incidencias) y a la derecha las acciones del cliente. En pantallas angostas se
        apilan en ese mismo orden. `minmax(0, …)` deja que el contenido se encoja en vez
        de ensanchar la columna.
      */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Section title="Seguimiento">
          <Stack gap={4}>
            {recorrido !== null && (
              <Card variant="outlined" padding="lg">
                <CardBody>
                  <Timeline
                    aria-label="Progreso del viaje"
                    orientation="horizontal"
                    stackBelow={480}
                    items={recorrido}
                  />
                </CardBody>
              </Card>
            )}

            <Card variant="outlined" padding="lg">
              <CardBody>
                <DescriptionList
                  items={datos}
                  columns={2}
                  orientation="vertical"
                  emptyValue="Sin ETA"
                />
              </CardBody>
            </Card>

            <Card variant="outlined" padding="lg">
              <CardHeader title="Incidencias" />
              <CardBody>
                {incidencias.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon={<CircleCheck />}
                    title="Sin incidencias reportadas."
                  />
                ) : (
                  <Stack as="ul" gap={2}>
                    {incidencias.map((incidencia, i) => (
                      <li key={`${incidencia.categoria}-${i}`}>
                        <IncidenciaItem incidencia={incidencia} />
                      </li>
                    ))}
                  </Stack>
                )}
              </CardBody>
            </Card>
          </Stack>
        </Section>

        <Section title="Acciones">
          <Stack gap={4}>
            <CancelarRechazarPanel viaje={viaje} />

            {/* El panel es dueño de su propio estado de servidor (useEmergencias), por eso solo recibe el `viajeId` y el estado que habilita activar. */}
            <EmergenciaPanel viajeId={viaje.id} estadoViaje={hito.estado} />
          </Stack>
        </Section>
      </div>

      {/*
        El enlace a "Bitacora" se desconectó con el recorte al contrato: la ruta
        /viajes/$viajeId/bitacora se retiró del enrutado (el contrato bff no define
        la bitácora). El componente se conserva en src/_desconectado/bitacora/.
      */}
    </Stack>
  );
}
