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
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      const sesion = await login({ usuario, password });

      // ADR 13 abierto: si Cognito entrega el OTP, este desvio puede no existir.
      if (sesion.requiereSegundoFactor) {
        await navigate({ to: '/two-factor' });
        return;
      }

      await navigate({ to: redirectTo ?? '/' });
    } catch (cause) {
      /*
       * Un login fallido no distingue "usuario no existe" de "password incorrecta":
       * hacerlo es un oraculo de enumeracion de cuentas.
       *
       * Lo que SI se distingue son las causas que no son del usuario, porque decirle
       * "contrasena incorrecta" cuando el servicio no responde —o cuando el endpoint
       * no esta desplegado— es la misma clase de mentira que el diseno persigue en la
       * ruta de datos: presentar un fallo nuestro como un fallo suyo.
       */
      if (isApiError(cause) && cause.esDegradacion) {
        setError('El servicio de identidad no responde. Intenta de nuevo en un momento.');
      } else if (isApiError(cause) && cause.kind === 'noEncontrado') {
        setError('No encontramos el servicio de sesion. Revisa la configuracion del entorno.');
      } else if (isApiError(cause) && cause.kind === 'noAutorizado') {
        setError('Usuario o contrasena incorrectos.');
      } else {
        setError('No pudimos completar el acceso. Intentalo de nuevo.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
      <Input
        label="Correo electronico empresarial"
        type="text"
        autoComplete="username"
        placeholder="nombre@empresa.com"
        leadingSlot={<Mail aria-hidden="true" className="size-4" />}
        value={usuario}
        onChange={(event) => setUsuario(event.target.value)}
        required
      />

      <Input
        label="Contrasena"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        leadingSlot={<Lock aria-hidden="true" className="size-4" />}
        trailingSlot={
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            className="text-slate-400 hover:text-slate-600"
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

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="focus:ring-brand-500 size-4 rounded border-slate-300"
          />
          Recordarme
        </label>

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
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" pending={pending} className="gap-2">
        {pending ? 'Entrando' : 'Iniciar sesion'}
        {!pending && <ArrowRight aria-hidden="true" className="size-4" />}
      </Button>

      {/* Nota de confianza del diseno. */}
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        Tu conexion es segura y esta protegida por los protocolos de seguridad de AI27.
      </p>
    </form>
  );
}
