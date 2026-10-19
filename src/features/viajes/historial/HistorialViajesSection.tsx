/*
 * HistorialViajesSection: la `*Section` del Historial de Viajes.
 *
 * Presentacional: recibe los viajes por props y NO llama a la API. El fetch lo hace el
 * `loader` de la ruta, que es la frontera. Aqui solo hay composicion: encabezado y la
 * tabla, que ya trae su propia barra de filtros (el `FilterTable` del design system).
 *
 */

import type { ViajeResumen } from '@/lib/contracts';
import { HistorialHeader } from './HistorialHeader';
import { HistorialViajesTable } from './HistorialViajesTable';

export function HistorialViajesSection({ viajes }: { readonly viajes: readonly ViajeResumen[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <HistorialHeader />
      {/* La tabla absorbe el alto sobrante: crece hasta el borde inferior del area. */}
      <div className="min-h-0 flex-1">
        <HistorialViajesTable viajes={viajes} />
      </div>
    </div>
  );
}
