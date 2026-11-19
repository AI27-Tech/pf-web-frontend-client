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
 * y el aviso de emergencia activa (si la hay). Debajo, dos columnas: el seguimiento
 * (recorrido en cuatro pasos, hito y ETA, incidencias) y las acciones del cliente (cancelar
 * o rechazar, emergencia); se apilan si el contenido no es lo bastante ancho. La conversación
 * del viaje va en el PANEL LATERAL del shell (columna fija a la derecha, todo el alto de la
 * pantalla), que arranca expandido y se contrae a una franja con el icono de mensaje (que lo
 * vuelve a expandir); contraído, la página recupera casi todo su ancho. La conversación llega como
 * ranura (`conversacion`) desde la ruta: esta sección no sabe cómo se pinta ni de dónde
 * carga. Ver `detalleLayout.ts` y `app/shell/PanelLateral.tsx`.
 *
 * Lo que el contrato NO expone aquí y por eso no se pinta: origen, destino, tipo de
 * servicio, fecha programada, unidad y operador (el resumen de ruta que traen otros
 * diseños), además de folio, fecha de solicitud y "condiciones activas". Volverán si el
 * contrato los publica. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import { useState, type ReactNode } from 'react';
import { CircleCheck, MessageSquare } from 'lucide-react';
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
import { PanelLateral } from '@/app/shell/PanelLateral';
import { useBreadcrumbLinks } from '@/app/shell/useBreadcrumbLinks';
import type { EstadoViaje, IncidenciaCurada, ViajeSeguimiento } from '@/lib/contracts';
import { formatDateTime } from '@/lib/utils';
import { CancelarRechazarPanel } from './CancelarRechazarPanel';
import { CLASE_CONTENEDOR_DETALLE, CLASE_REJILLA_DETALLE } from './detalleLayout';
import { EmergenciaPanel } from './EmergenciaPanel';
import { EstadoViajeChip } from './EstadoViajeChip';
import { recorridoDelViaje } from './pasosViaje';
import { useEmergencias } from './useEmergencias';

/** Id del panel de la conversación: lo referencian sus botones de contraer y expandir. */
const ID_PANEL_CONVERSACION = 'conversacion-panel';

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
  conversacion,
}: {
  readonly viaje: ViajeSeguimiento;
  readonly estadoHistorial?: EstadoViaje | undefined;
  readonly conversacion?: ReactNode;
}) {
  const { hito, eta, incidencias } = viaje;
  const { historial } = useBreadcrumbLinks();
  const [conversacionExpandida, setConversacionExpandida] = useState(true);
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
    <Stack gap={4} className={CLASE_CONTENEDOR_DETALLE}>
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

      <div className={CLASE_REJILLA_DETALLE}>
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

      {conversacion !== undefined && (
        <PanelLateral
          id={ID_PANEL_CONVERSACION}
          title="Conversación"
          icon={MessageSquare}
          collapsed={!conversacionExpandida}
          onToggle={() => setConversacionExpandida((expandida) => !expandida)}
          collapseLabel="Contraer conversación"
          expandLabel="Expandir conversación"
        >
          {conversacion}
        </PanelLateral>
      )}

      {/*
        El enlace a "Bitacora" se desconectó con el recorte al contrato: la ruta
        /viajes/$viajeId/bitacora se retiró del enrutado (el contrato bff no define
        la bitácora). El componente se conserva en src/_desconectado/bitacora/.
      */}
    </Stack>
  );
}
