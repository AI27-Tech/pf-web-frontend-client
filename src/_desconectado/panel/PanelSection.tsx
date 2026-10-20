/*
 * PanelSection. La `*Section` del dominio `panel`.
 *
 * Presentacional: recibe el panel por props y NO llama a la API. El fetch lo hace el
 * `loader` de la ruta, que es la frontera. Aqui solo hay composicion y layout.
 *
 */

import { useState } from 'react';
import { ShieldCheck, TrendingUp, TriangleAlert, Truck } from 'lucide-react';
import { Toast, ToastContainer, type ToastVariant } from '@ai27-tech/ui';
import type { PanelDeControl, SeveridadNotificacion } from './tipos';
import { KpiCard } from './KpiCard';
import { QuickActionsCard } from './QuickActionsCard';
import { ViajesEnCursoTable } from './ViajesEnCursoTable';
import { MapPlaceholderCard } from './MapPlaceholderCard';

/** Etiquetas de los niveles de riesgo que el cliente conoce. Union abierta. */
const riskLabel: Readonly<Record<string, string>> = {
  BAJO_NORMAL: 'Bajo / Normal',
};

/** Signo explicito: "+3" y "-2" se leen como variacion; "3" se leeria como total. */
function withSign(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Severidad del dominio -> variante del `Toast` de la libreria. Union abierta: una
 * severidad que no conocemos cae en `info`, en lugar de disfrazarse de error.
 */
function toastVariant(severidad: SeveridadNotificacion): ToastVariant {
  if (severidad === 'critica') return 'error';
  return 'info';
}

export function PanelSection({ panel }: { readonly panel: PanelDeControl }) {
  const { viajesActivos, riesgoGlobal, alertasActivas, viajesEnCurso, notificaciones } = panel;

  const hasAlerts = alertasActivas.total > 0;

  // Las notificaciones se muestran como toasts descartables. El `ToastContainer` pide
  // que la lista viva en nuestro estado; al cerrar uno, se retira por id. No llevan
  // `duration`: se quedan hasta que el usuario los cierra, para no perder un aviso que
  // no alcanzo a leer (antes eran una lista persistente en una tarjeta).
  const [notices, setNotices] = useState(notificaciones);

  function dismissNotice(id: string): void {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }

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
          value={riskLabel[riesgoGlobal.nivel] ?? riesgoGlobal.nivel}
          icon={<ShieldCheck aria-hidden="true" className="size-5" />}
          tone="primary"
          footer={`${riesgoGlobal.unidadesSegurasPct}% de unidades seguras`}
        />

        <KpiCard
          label="Alertas activas"
          value={alertasActivas.total}
          icon={<TriangleAlert aria-hidden="true" className="size-5" />}
          // Sin alertas, el indicador no debe seguir gritando en rojo.
          tone={hasAlerts ? 'error' : 'neutral'}
          footer={hasAlerts ? 'Requieren atención inmediata' : 'Sin alertas pendientes'}
        />

        <QuickActionsCard />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
        {/* La tabla es el contenido principal: primera en el DOM y en la lectura. */}
        <div className="h-full xl:col-span-2">
          <ViajesEnCursoTable viajes={viajesEnCurso} />
        </div>

        {/* La columna derecha es ahora solo el mapa: las notificaciones salieron del
            layout y viven como toasts en una esquina del viewport. */}
        <div className="h-full min-h-56">
          <MapPlaceholderCard />
        </div>
      </div>

      {/* Notificaciones como toasts de la libreria: portal fijo en una esquina, fuera
          del flujo del layout. Se renderiza solo si queda algun aviso sin descartar. */}
      {notices.length > 0 && (
        <ToastContainer position="bottom-right">
          {notices.map((notice) => (
            <Toast
              key={notice.id}
              variant={toastVariant(notice.severidad)}
              title={notice.titulo}
              onClose={() => dismissNotice(notice.id)}
            >
              {notice.cuerpo}
            </Toast>
          ))}
        </ToastContainer>
      )}
    </div>
  );
}
