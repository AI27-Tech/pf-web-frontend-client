/*
 * ConversacionesListSection. Presentacional.
 *
 * Es la lista de conversaciones DEL CLIENTE, no una bandeja. Bandejas, cola, reclamo,
 * transferencia y auditoria son de audiencia interna y viven en `panel-admin`.
 */

import { Link } from '@tanstack/react-router';
import type { ConversacionResumen } from '@/lib/contracts';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';

export function ConversacionesListSection({
  conversaciones,
}: {
  readonly conversaciones: readonly ConversacionResumen[];
}) {
  if (conversaciones.length === 0) {
    return <EmptyState title="Sin conversaciones" />;
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
      {conversaciones.map((conversacion) => (
        <li key={conversacion.id}>
          <Link
            to="/conversaciones/$conversacionId"
            params={{ conversacionId: conversacion.id }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
          >
            <span className="flex-1 text-sm font-medium">{conversacion.asunto}</span>

            {conversacion.noLeidos > 0 && (
              <span className="bg-brand-600 rounded-full px-2 py-0.5 text-xs text-white">
                {conversacion.noLeidos}
              </span>
            )}

            {conversacion.ultimoMensajeEn !== null && (
              <span className="text-xs text-slate-500">
                {formatDateTime(conversacion.ultimoMensajeEn)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
