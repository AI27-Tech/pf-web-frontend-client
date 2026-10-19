/*
 * Segundo factor.
 *
 * PLACEHDER CONDICIONADO A ADR 13. La decision abierta es si Cognito entrega el OTP
 * o si lo entrega `identidad` via `mensajeria`:
 *
 *   - Si lo entrega Cognito, `identidad` no expone /otp/desafios ni /verificaciones,
 *     el evento `otp.solicitado` desaparece, y ESTA RUTA probablemente no existe:
 *     el reto se resuelve dentro del flujo de Cognito.
 *   - Si se queda de nuestro lado, esta ruta se implementa contra bff.
 *
 * Por eso el formulario no llama a ninguna API: no hay contra que llamar todavia.
 */

import { createFileRoute } from '@tanstack/react-router';
import { Button, FormField, Input } from '@ai27-tech/ui';

export const Route = createFileRoute('/(auth)/two-factor')({
  component: TwoFactorPage,
});

function TwoFactorPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="text-on-surface mb-1 text-xl font-semibold">Verificacion</h1>
      <p className="text-on-surface-variant mb-6 text-sm">
        Introduce el codigo que te enviamos para completar el acceso.
      </p>

      <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
        <FormField label="Codigo">
          <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
        </FormField>
        {/* TODO(ADR 13): cablear contra bff, o eliminar la ruta si el OTP es de Cognito. */}
        <Button type="submit" disabled>
          Verificar
        </Button>
        <p className="text-on-surface-variant text-xs">
          Pendiente de ADR 13: aun no esta decidido si el OTP lo entrega Cognito o la plataforma.
        </p>
      </form>
    </main>
  );
}
