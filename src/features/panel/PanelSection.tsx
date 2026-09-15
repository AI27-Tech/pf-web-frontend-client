/*
 * PanelSection. La `*Section` del dominio `panel`.
 *
 * Presentacional: recibe el panel por props y NO llama a la API. El fetch lo hace el
 * `loader` de la ruta, que es la frontera. Aqui solo hay composicion y layout.
 *
 */

import { ShieldCheck, TrendingUp, TriangleAlert, Truck } from 'lucide-react';
import type { PanelDeControl } from '@/lib/contracts';
import { KpiCard } from './KpiCard';
import { QuickActionsCard } from './QuickActionsCard';
import { ViajesEnCursoTable } from './ViajesEnCursoTable';
import { MapPlaceholderCard } from './MapPlaceholderCard';
import { NotificacionesCard } from './NotificacionesCard';

/** Etiquetas de los niveles de riesgo que el cliente conoce. Union abierta. */
const riesgoLabel: Readonly<Record<string, string>> = {
  BAJO_NORMAL: 'Bajo / Normal',
};

/** Signo explicito: "+3" y "-2" se leen como variacion; "3" se leeria como total. */
function withSign(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function PanelSection({ panel }: { readonly panel: PanelDeControl }) {
  const { viajesActivos, riesgoGlobal, alertasActivas, viajesEnCurso, notificaciones } = panel;

  const hayAlertas = alertasActivas.total > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Viajes activos"
          value={viajesActivos.total}
          icon={<Truck aria-hidden="true" className="size-5" />}
          tone="neutral"
          footer={
            <>
              <TrendingUp aria-hidden="true" className="text-success size-3.5 shrink-0" />
              <span className="text-on-success-container">
                {withSign(viajesActivos.deltaDesdeAyer)} desde ayer
              </span>
            </>
          }
        />

        <KpiCard
          label="Nivel de riesgo global"
          // Sin etiqueta conocida se muestra el codigo: avisa de que falta mapearlo.
          value={riesgoLabel[riesgoGlobal.nivel] ?? riesgoGlobal.nivel}
          icon={<ShieldCheck aria-hidden="true" className="size-5" />}
          tone="primary"
          footer={`${riesgoGlobal.unidadesSegurasPct}% de unidades seguras`}
        />

        <KpiCard
          label="Alertas activas"
          value={alertasActivas.total}
          icon={<TriangleAlert aria-hidden="true" className="size-5" />}
          // Sin alertas, el indicador no debe seguir gritando en rojo.
          tone={hayAlertas ? 'error' : 'neutral'}
          footer={hayAlertas ? 'Requieren atención inmediata' : 'Sin alertas pendientes'}
        />

        <QuickActionsCard />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
        {/* La tabla es el contenido principal: primera en el DOM y en la lectura. */}
        <div className="h-full xl:col-span-2">
          <ViajesEnCursoTable viajes={viajesEnCurso} />
        </div>

        <div className="flex h-full min-h-0 flex-col gap-4 lg:gap-6">
          <div className="min-h-56 flex-1">
            <MapPlaceholderCard />
          </div>
          <NotificacionesCard notificaciones={notificaciones} />
        </div>
      </div>
    </div>
  );
}
