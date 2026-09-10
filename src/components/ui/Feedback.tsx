/*
 * Estados de carga, vacio y error.
 *
 * `ErrorState` distingue degradacion de rotura, porque la taxonomia de errores del
 * cliente lo distingue: un aguas-abajo caido nunca se presenta como "no encontrado",
 * y un servicio degradado no se presenta como un fallo del usuario.
 */

import type { ReactNode } from 'react';
import { isApiError } from '@/lib/api/errors';
import { Button } from './Button';

export function Spinner({ label = 'Cargando' }: { readonly label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-6 text-sm text-slate-500">
      <span
        aria-hidden="true"
        className="border-brand-600 size-4 animate-spin rounded-full border-2 border-t-transparent"
      />
      {label}…
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white py-10 text-center ring-1 ring-slate-200">
      <p className="font-medium text-slate-700">{title}</p>
      {children !== undefined && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry?: () => void;
}) {
  const degradado = isApiError(error) && error.esDegradacion;
  const noAutorizado = isApiError(error) && error.kind === 'noAutorizado';

  const title = degradado
    ? 'No podemos mostrar esto ahora mismo'
    : noAutorizado
      ? 'Tu sesion no permite ver esto'
      : 'Algo se rompio';

  const detail = degradado
    ? 'Un servicio del que dependemos no esta respondiendo. No es que el dato no exista: es que no lo tenemos en este momento.'
    : noAutorizado
      ? 'Vuelve a iniciar sesion. Si el problema sigue, tu acceso pudo haber cambiado.'
      : 'Se registro el fallo. Puedes reintentar.';

  return (
    <div
      role="alert"
      className={
        degradado
          ? 'bg-degradado-50 text-degradado-800 flex flex-col gap-3 rounded-lg p-5'
          : 'flex flex-col gap-3 rounded-lg bg-red-50 p-5 text-red-900'
      }
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm">{detail}</p>
      {onRetry !== undefined && (
        <div>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
