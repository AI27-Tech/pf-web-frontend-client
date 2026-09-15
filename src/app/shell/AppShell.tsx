import { Link, Outlet, useRouterState } from '@tanstack/react-router';
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
import { Button, Sidebar, SidebarGroup, SidebarItem } from '@ai27-tech/ui';

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

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  /*
   * Un item con `to` exacto que coincide con el pathname "reclama" esa ruta: en ese
   * caso, un item padre no-exact (ej. `/viajes`) NO debe activarse tambien. Asi, en
   * `/viajes/new` se activa solo "Solicitar Servicio", no "Historial de Viajes".
   */
  const claimedByExact = nav.some((item) => item.exact === true && pathname === item.to);

  return (
    <div className="flex h-dvh">
      <Sidebar
        className="h-dv"
        header={
          <div className="flex items-center gap-3">
            <ShieldHalf className="size-6 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold">AI27</span>
              <span className="text-xs font-semibold opacity-70">Seguridad Logística</span>
            </div>
          </div>
        }
        footer={
          <Button
            variant="primary"
            fullWidth
            startIcon={<Plus />}
            onClick={() => console.log('Redirect to new travel...')}
          >
            Nuevo viaje
          </Button>
        }
      >
        <SidebarGroup>
          {nav.map(({ to, label, icon: Icon, exact = false }) => {
            const active = isItemActive(pathname, to, exact) && (exact || !claimedByExact);
            return (
              <SidebarItem
                key={to}
                as={Link}
                label={label}
                active={active}
                icon={<Icon className="size-full" />}
                // `to` es una prop del Link de TanStack; SidebarItem la reenvia via `...props`
                // pero su tipo no la declara, de ahi el cast puntual.
                {...({ to } as { to: string })}
              >
                {label}
              </SidebarItem>
            );
          })}
        </SidebarGroup>
      </Sidebar>

      <main id="contenido" className="flex w-full flex-1 flex-col overflow-y-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
