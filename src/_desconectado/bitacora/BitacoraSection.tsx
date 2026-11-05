/*
 * BitacoraSection — DESCONECTADO (recorte al contrato, E8-T3).
 *
 * Muestra la bitácora VISIBLE al cliente de un viaje. El contrato `bff` NO define
 * hoy esta superficie (ni `GET /viajes/{id}/bitacora` ni el tipo de entrada), así que
 * la pantalla se desconectó del enrutado en vez de borrarse: sigue aquí, funcionando,
 * lista para reconectar cuando el contrato la publique.
 *
 * Por eso su tipo `EntradaBitacora` es LOCAL y provisional, no viene de
 * `@/lib/contracts`: el barrel de contratos solo debe contener lo que el contrato
 * real define. Al reconectar, se sustituye por el tipo generado.
 *
 * Reconectar: recrear `src/routes/_private/viajes/$viajeId/bitacora.tsx` con un loader
 * que llame a la función de API correspondiente, y volver a enlazarla desde el detalle.
 */

import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';

/** Entrada de bitácora visible al cliente. Tipo LOCAL provisional (fuera del contrato). */
export interface EntradaBitacora {
  readonly id: string;
  readonly ocurrioEn: string;
  readonly descripcion: string;
}

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
