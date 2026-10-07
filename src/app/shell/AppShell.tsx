import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  MessageSquare,
  Plus,
  RotateCcwClock,
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

/*
 * La navegacion V1 del portal del cliente. Cada entrada lleva a una capacidad real de
 * V1 (criterio de aceptacion de E9-T1): ninguna nombra una capacidad diferida a V2.
 *
 * Lo que cambio respecto al scaffold (E9-T1 / E9-T10):
 *   - Se agrego "Mensajes" (`/conversaciones`): la conversacion por viaje (E3-HU-014)
 *     es una capacidad V1 cuyas dos rutas ya existian pero eran inalcanzables por menu.
 *   - Se retiro "Seguimiento en Vivo" (`/seguimiento`): era una pantalla de telemetria
 *     viva (posicion, mapa, velocidad, señal) que DEC-001 excluye de V1. Se saco del
 *     release path en E9-T10 (F-06); lo que V1 sabe de un viaje en curso ya lo muestran
 *     el Panel de Control y el Historial de Viajes.
 *   - Se retiro "Configuración" (`/configuracion`): era un placeholder sin HU que lo
 *     respalde en V1. La ruta ya no se ofrece por navegacion.
 */
const nav: readonly NavItem[] = [
  { to: '/', label: 'Panel de Control', icon: LayoutDashboard, exact: true },
  // `exact: false` a proposito: activo tambien en el detalle `/viajes/$viajeId`.
  { to: '/viajes', label: 'Historial de Viajes', icon: RotateCcwClock, exact: false },
  // `exact: true`: es hijo de `/viajes`, no debe activar tambien a Historial.
  { to: '/viajes/new', label: 'Solicitar Servicio', icon: SquarePlus, exact: true },
  // `exact: false`: activo tambien en el detalle `/conversaciones/$conversacionId`.
  { to: '/conversaciones', label: 'Mensajes', icon: MessageSquare, exact: false },
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
    // El documento scrollea de forma normal (`min-h-dvh`, sin recortar el overflow): el
    // Sidebar se queda a la vista porque es `sticky`, no porque el shell fije la altura.
    // Nada de overflow en el contenedor, o el `position: sticky` del sidebar no pegaria.
    <div className="flex min-h-dvh">
      {/*
       * El STICKY y el alto viven en este wrapper, NO en el Sidebar. El Sidebar de la
       * libreria trae `height:100%` en su CSS; si le pusieramos `h-dvh` competiria con
       * esa regla (carrera de especificidad entre la utilidad y el CSS Module) y el alto
       * quedaba indeterminado -> a veces media pantalla. En su lugar, el wrapper es quien
       * define alto de viewport y pegado, y el Sidebar toma `h-full` (su `height:100%`
       * resuelve contra el wrapper, que ya tiene alto real).
       *
       * `shrink-0`: el Sidebar fija `width:15rem` pero no trae `flex-shrink:0`; sin esto
       * el <main> lo comprimiria dentro del flex-row.
       */}
      <div className="sticky top-0 h-dvh shrink-0 self-start">
        <Sidebar
          className="h-full"
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
      </div>

      {/* `min-w-0` deja que <main> se encoja dentro del flex-row (por defecto un item
          flex no baja de su ancho de contenido). No lleva scroll propio: el scroll es el
          del documento, y el sidebar lo acompaña como sticky. */}
      <main id="contenido" className="flex w-full min-w-0 flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
