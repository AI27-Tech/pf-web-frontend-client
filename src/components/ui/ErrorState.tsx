/*
 * ErrorState: traduce un error del cliente al aviso que ve el usuario.
 */

import { Alert, Button, Stack } from '@ai27-tech/ui';
import { isApiError } from '@/lib/api/errors';

export function ErrorState({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry?: () => void;
}) {
  const degradado = isApiError(error) && error.esDegradacion;
  const noAutorizado = isApiError(error) && error.kind === 'noAutorizado';
  const noEncontrado = isApiError(error) && error.kind === 'noEncontrado';

  const title = degradado
    ? 'No podemos mostrar esto ahora mismo'
    : noAutorizado
      ? 'Tu sesión no permite ver esto'
      : noEncontrado
        ? 'No encontramos lo que buscas'
        : 'Algo se rompió';

  const detail = degradado
    ? 'Un servicio del que dependemos no está respondiendo. No es que el dato no exista: es que no lo tenemos en este momento.'
    : noAutorizado
      ? 'Vuelve a iniciar sesión. Si el problema sigue, tu acceso pudo haber cambiado.'
      : noEncontrado
        ? 'Revisa el enlace o vuelve a tu lista de viajes.'
        : 'Se registró el fallo. Puedes reintentar.';

  return (
    <Alert variant={degradado ? 'warning' : 'danger'} title={title}>
      <Stack gap={3} align="start">
        <span>{detail}</span>
        {onRetry !== undefined && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </Stack>
    </Alert>
  );
}
