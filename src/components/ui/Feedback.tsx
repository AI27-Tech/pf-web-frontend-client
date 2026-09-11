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
    <div role="status" className="text-on-surface-variant flex items-center gap-2 py-6 text-sm">
      <span
        aria-hidden="true"
        className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent"
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
    <div className="bg-surface-container-lowest border-outline-variant rounded-lg border py-10 text-center">
      <p className="text-on-surface font-medium">{title}</p>
      {children !== undefined && (
        <div className="text-on-surface-variant mt-2 text-sm">{children}</div>
      )}
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
          : 'bg-error-container text-on-error-container flex flex-col gap-3 rounded-lg p-5'
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
