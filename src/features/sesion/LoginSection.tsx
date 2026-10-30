/*
 * LoginSection. La `*Section` del dominio `sesion`.
 *
 * Es Client por necesidad —es un formulario— y esa es la regla: la interactividad
 * baja hasta donde de verdad hace falta. Las Sections que solo muestran datos no
 * gestionan estado ni traen datos; esta lo hace porque un login es, literalmente,
 * un comando con estado de envio.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { Button, Checkbox, FormField, Input } from '@ai27-tech/ui';
import { isApiError } from '@/lib/api/errors';

interface LoginSectionProps {
  /** Adonde volver tras autenticarse. Lo lee la RUTA y lo pasa por props. */
  readonly redirectTo?: string | undefined;
}

export function LoginSection({ redirectTo }: LoginSectionProps) {
  const { login } = useSession();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [segundoFactor, setSegundoFactor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Estado puramente de UI: no viaja a `login()` ni afecta la autenticacion.
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      /*
       * Paso unico. El contrato de sesion (`CredencialesEntrada`) recibe `usuario`,
       * `contrasena` y `segundo_factor` opcional (TOTP, `tracer.20`). El portal NO
       * construye un tramo propio de OTP: el reto es del IdP (Keycloak), que lo
       * valida; `bff`/`identidad` solo lo transportan (DEC-031/ADR 13, DEC-071). Por
       * eso el codigo viaja JUNTO a las credenciales en un solo `POST /sesion` y la
       * ruta `/two-factor` separada se retira.
       *
       * Se envia `segundo_factor` solo cuando el usuario escribio algo; vacio se omite
       * para no forzar la forma del cuerpo (el contrato lo declara opcional/nullable).
       */
      const codigo = segundoFactor.trim();
      await login({
        usuario,
        contrasena: password,
        ...(codigo.length > 0 ? { segundo_factor: codigo } : {}),
      });

      await navigate({ to: redirectTo ?? '/' });
    } catch (cause) {
      /*
       * Un login fallido no distingue "usuario no existe" de "password incorrecta" ni
       * de "segundo factor invalido o vencido": todas son el mismo 401 uniforme del
       * lado de `identidad` (DEC-094), y distinguirlas seria un oraculo de enumeracion
       * de cuentas. El mensaje es, a proposito, identico exista o no el usuario.
       *
       * Lo que SI se distingue son las causas que no son del usuario, porque decirle
       * "credenciales incorrectas" cuando el servicio no responde —o cuando el IdP no
       * esta disponible— es la misma clase de mentira que el diseno persigue en la
       * ruta de datos: presentar un fallo nuestro como un fallo suyo.
       */
      if (isApiError(cause) && cause.esDegradacion) {
        setError(
          'El servicio de identidad no esta disponible en este momento. Intenta de nuevo en unos minutos.',
        );
      } else if (isApiError(cause) && cause.kind === 'noEncontrado') {
        setError('No encontramos el servicio de sesion. Revisa la configuracion del entorno.');
      } else if (isApiError(cause) && cause.kind === 'noAutorizado') {
        setError('Usuario, contrasena o codigo de verificacion incorrectos.');
      } else {
        setError('No pudimos completar el acceso. Intentalo de nuevo.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
      <FormField label="Correo electronico empresarial">
        <Input
          type="text"
          autoComplete="username"
          placeholder="nombre@empresa.com"
          startAdornment={<Mail aria-hidden="true" className="size-4" />}
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
          required
        />
      </FormField>

      <FormField label="Contrasena">
        <Input
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          startAdornment={<Lock aria-hidden="true" className="size-4" />}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              className="text-on-surface-variant hover:text-on-surface"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </FormField>

      {/*
       * Segundo factor (TOTP). La politica de MFA es del IdP,
       * no del portal; por eso el campo no es `required` en el cliente.
       */}
      <FormField label="Codigo de verificacion">
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          startAdornment={<KeyRound aria-hidden="true" className="size-4" />}
          value={segundoFactor}
          onChange={(event) => setSegundoFactor(event.target.value)}
        />
      </FormField>

      <div className="flex items-center justify-between text-sm">
        <Checkbox
          label="Recordarme"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />

        {/*
         * Enlace inerte: el diseno lo pide, pero no hay flujo de recuperacion de
         * contrasena implementado. `href="#"` evita un <a> sin destino real
         * mientras no exista la ruta.
         */}
        <a href="#" className="text-brand-700 font-medium hover:underline">
          Olvidaste tu contrasena?
        </a>
      </div>

      {error !== null && (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={pending}
        fullWidth
        endIcon={!pending ? <ArrowRight aria-hidden="true" className="size-4" /> : undefined}
      >
        {pending ? 'Entrando' : 'Iniciar sesion'}
      </Button>

      {/* Nota de confianza del diseno. */}
      <p className="text-on-surface-variant flex items-center gap-1.5 text-xs">
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        Tu conexion es segura y esta protegida por los protocolos de seguridad de AI27.
      </p>
    </form>
  );
}
