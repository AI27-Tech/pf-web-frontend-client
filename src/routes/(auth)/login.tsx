import { createFileRoute } from '@tanstack/react-router';
import { LoginSection } from '@/features/sesion/LoginSection';
import screenBg from '@/app/assets/login/screen-bg.png';

export const Route = createFileRoute('/(auth)/login')({
  // Tipado del search param: adonde volver despues de autenticarse.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    ...(typeof search['redirect'] === 'string' ? { redirect: search['redirect'] } : {}),
  }),
  component: LoginPage,
});

function LoginPage() {
  // La ruta lee su propio search param y lo entrega a la Section por props.
  const { redirect } = Route.useSearch();

  return (
    <main className="flex min-h-dvh flex-col md:flex-row">
      <div className="bg-brand-700 relative hidden flex-1 overflow-hidden md:flex md:min-h-dvh">
        <img
          src={screenBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        {/* Veladura sobre la foto para que el texto en blanco se lea encima. */}
        <div
          aria-hidden="true"
          className="from-brand-700/85 absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
        />

        <div className="relative flex flex-1 flex-col justify-between p-8">
          {/* Logo. Espacio reservado para el icono/isotipo definitivo de AI27. */}
          <div className="flex items-center gap-2">
            <span className="bg-brand-600 flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white">
              A
            </span>
            <span className="text-sm font-semibold text-white">AI27</span>
          </div>

          <div className="text-white">
            <h2 className="mb-2 text-lg font-semibold">Seguridad Logistica Inteligente</h2>
            <p className="max-w-sm text-sm text-white/80">
              Plataforma avanzada para la gestion, monitoreo y proteccion de tus operaciones en
              tiempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Panel de formulario. */}
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Iniciar sesion</h1>
          <p className="mb-6 text-sm text-slate-600">Ingresa a tu Portal de Clientes</p>
          <LoginSection redirectTo={redirect} />
        </div>
      </div>
    </main>
  );
}
