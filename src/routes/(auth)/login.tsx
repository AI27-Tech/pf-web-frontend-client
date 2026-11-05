import { createFileRoute } from '@tanstack/react-router';
import { LoginSection } from '@/features/sesion/LoginSection';
import { Toast, ToastContainer } from '@ai27-tech/ui';
import screenBg from '@/app/assets/login/screen-bg.png';

type LoginSearch = {
  redirect?: string;
  motivo?: 'sesion_finalizada';
};

export const Route = createFileRoute('/(auth)/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    ...(typeof search['redirect'] === 'string' ? { redirect: search['redirect'] } : {}),
    ...(search['motivo'] === 'sesion_finalizada' ? { motivo: 'sesion_finalizada' } : {}),
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, motivo } = Route.useSearch();

  return (
    <main className="flex min-h-dvh flex-col md:flex-row">
      <div className="bg-brand-700 relative hidden flex-1 overflow-hidden md:flex md:min-h-dvh">
        <img
          src={screenBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="from-brand-700/85 absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
        />
        <div className="relative flex flex-1 flex-col justify-between p-8">
          <div className="flex items-center gap-2">
            <span className="bg-brand-600 flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white">
              A
            </span>
            <span className="text-sm font-semibold text-white">AI27</span>
          </div>
          <div className="text-white">
            <h2 className="mb-2 text-lg font-semibold">Seguridad Logística Inteligente</h2>
            <p className="max-w-sm text-sm text-white/80">
              Plataforma avanzada para la gestión, monitoreo y protección de tus operaciones en
              tiempo real.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {motivo === 'sesion_finalizada' && (
            <ToastContainer position="top-right">
              <Toast
                variant="info"
                title="Tu sesión finalizó. Inicia sesión de nuevo para continuar."
              />
            </ToastContainer>
          )}
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Iniciar sesion</h1>
          <p className="mb-6 text-sm text-slate-600">Ingresa a tu Portal de Clientes</p>
          <LoginSection redirectTo={redirect} />
        </div>
      </div>
    </main>
  );
}
