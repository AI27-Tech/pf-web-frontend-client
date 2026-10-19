/*
 * ConversacionesListSection. Presentacional.
 *
 * Es la lista de conversaciones DEL CLIENTE, no una bandeja. Bandejas, cola, reclamo,
 * transferencia y auditoria son de audiencia interna y viven en `panel-admin`.
 */

import { Link } from '@tanstack/react-router';
import { Badge } from '@ai27-tech/ui';
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
    <ul className="divide-outline-variant bg-surface-container-lowest border-outline-variant divide-y overflow-hidden rounded-lg border">
      {conversaciones.map((conversacion) => (
        <li key={conversacion.id}>
          <Link
            to="/conversaciones/$conversacionId"
            params={{ conversacionId: conversacion.id }}
            className="hover:bg-surface-container flex items-center gap-3 px-4 py-3"
          >
            <span className="text-on-surface flex-1 text-sm font-medium">
              {conversacion.asunto}
            </span>

            {conversacion.noLeidos > 0 && (
              <Badge variant="escort" pill>
                {conversacion.noLeidos}
              </Badge>
            )}

            {conversacion.ultimoMensajeEn !== null && (
              <span className="text-on-surface-variant text-xs">
                {formatDateTime(conversacion.ultimoMensajeEn)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
