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
        <li key={entrada.id} className="border-outline-variant border-l-2 pl-3">
          <p className="text-on-surface text-sm">{entrada.descripcion}</p>
          <p className="text-on-surface-variant text-xs">{formatDateTime(entrada.ocurrioEn)}</p>
        </li>
      ))}
    </ol>
  );
}
