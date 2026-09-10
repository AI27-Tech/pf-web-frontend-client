/*
 * BitacoraSection. Presentacional.
 *
 * Solo la bitacora VISIBLE al cliente. La auditoria probatoria completa es de
 * `operacion` y no cruza a esta audiencia.
 */

import type { EntradaBitacora } from '@/lib/contracts';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';

export function BitacoraSection({ entradas }: { readonly entradas: readonly EntradaBitacora[] }) {
  if (entradas.length === 0) {
    return <EmptyState title="Sin registros en la bitacora" />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entradas.map((entrada) => (
        <li key={entrada.id} className="border-l-2 border-slate-200 pl-3">
          <p className="text-sm">{entrada.descripcion}</p>
          <p className="text-xs text-slate-500">{formatDateTime(entrada.ocurrioEn)}</p>
        </li>
      ))}
    </ol>
  );
}
