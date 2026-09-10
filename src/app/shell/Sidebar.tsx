import { Link, useRouterState } from '@tanstack/react-router';
import { cx } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  Map,
  Plus,
  RotateCcwClock,
  Settings,
  ShieldHalf,
  SquarePlus,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /**
   * Match exacto de la ruta. Necesario cuando el `to` es PREFIJO de otro item, para
   * que no se activen dos pestanas a la vez. Ej: `/viajes` es prefijo de `/viajes/new`,
   * asi que sin `exact` ambos se marcarian activos al estar en `/viajes/new`.
   */
  readonly exact?: boolean;
};

const nav: readonly NavItem[] = [
  { to: '/', label: 'Panel de Control', icon: LayoutDashboard, exact: true },
  { to: '/seguimiento', label: 'Seguimiento en Vivo', icon: Map },
  // `exact: false` a proposito: activo tambien en el detalle `/viajes/$viajeId`.
  { to: '/viajes', label: 'Historial de Viajes', icon: RotateCcwClock, exact: false },
  // `exact: true`: es hijo de `/viajes`, no debe activar tambien a Historial.
  { to: '/viajes/new', label: 'Solicitar Servicio', icon: SquarePlus, exact: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

/**
 * Decide si un item esta activo para el pathname actual.
 * - exact: coincide solo la ruta identica (evita que un prefijo active a un hijo).
 * - no exact: coincide la ruta o cualquier subruta (`/viajes` cubre `/viajes/123`).
 * El matching es por SEGMENTO, no por substring: `/viajes` no activa a `/viajesX`.
 */
function isItemActive(pathname: string, to: string, exact: boolean): boolean {
  if (exact) return pathname === to;
  if (pathname === to) return true;
  const base = to.endsWith('/') ? to : `${to}/`;
  return pathname.startsWith(base);
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  /*
   * Un item con `to` exacto que coincide con el pathname "reclama" esa ruta: en ese
   * caso, un item padre no-exact (ej. `/viajes`) NO debe activarse tambien. Asi, en
   * `/viajes/new` se activa solo "Solicitar Servicio", no "Historial de Viajes".
   */
  const claimedByExact = nav.some((item) => item.exact === true && pathname === item.to);

  return (
    // Navy estructural en ambos temas via el rol propio `sidebar` (ver globals.css).
    // Todo el contenido usa `on-sidebar` para contraste consistente sobre el navy.
    <aside className="bg-sidebar text-on-sidebar border-primary sticky top-0 flex h-dvh w-72 shrink-0 flex-col border-r-2">
      <div className="mb-3 flex items-center gap-3 px-4 py-5">
        <ShieldHalf className="size-8 shrink-0" />
        <div className="flex flex-col">
          <span className="text-3xl font-bold">AI27</span>
          <span className="text-on-sidebar/70 text-sm font-semibold">Seguridad Logística</span>
        </div>
      </div>

      <nav aria-label="Principal" className="flex flex-1 flex-col gap-2">
        {nav.map(({ to, label, icon: Icon, exact = false }) => {
          const active = isItemActive(pathname, to, exact) && (exact || !claimedByExact);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={cx(
                // `group` deja que el icono reaccione al hover del enlace.
                // La transicion cubre color, fondo, borde y desplazamiento; el
                // motion-reduce desactiva el movimiento para quien lo prefiere.
                'group flex items-center gap-3 border-l-4 px-5 py-3 text-sm',
                'transition-[background-color,color,border-color,transform] duration-200 ease-out',
                'motion-reduce:transition-none',
                active
                  ? 'border-secondary bg-on-sidebar/10'
                  : 'text-on-sidebar/80 hover:bg-on-sidebar/10 hover:text-on-sidebar border-transparent hover:translate-x-1',
              )}
            >
              <Icon className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transform-none" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-5">
        <Button
          variant="primary"
          className="group bg-primary text-on-primary flex h-12 w-full cursor-pointer justify-center gap-2 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
          onClick={() => console.log('Redirect to new travel...')}
        >
          <Plus className="shrink-0 transition-transform duration-200 ease-out group-hover:rotate-90 motion-reduce:transform-none" />
          Nuevo viaje
        </Button>
      </div>
    </aside>
  );
}
