/*
 * PanelLateral: la columna fija del lado derecho del shell, como el `Sidebar` de la
 * librería pero a la derecha: mide todo el alto de la pantalla, se queda pegada al
 * desplazar la página y la página principal se angosta mientras está abierta.
 *
 * Dos piezas:
 *   - `RanuraPanelLateral` es el contenedor vacío que pinta `AppShell` junto a `<main>`. Se
 *     oculta solo (`empty:hidden`) cuando nadie le pone un panel, así que no ocupa lugar.
 *   - `PanelLateral` lo usa la pantalla que quiere un panel: su contenido se pinta DENTRO de
 *     la ranura (portal), aunque la pantalla viva dentro de `<main>`. Sin ranura (fuera del
 *     shell) no pinta nada.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PanelRightClose, type LucideIcon } from 'lucide-react';
import { Button } from '@ai27-tech/ui';

const ContextoRanura = createContext<HTMLElement | null>(null);

export function ProveedorRanuraPanelLateral({
  ranura,
  children,
}: {
  readonly ranura: HTMLElement | null;
  readonly children: ReactNode;
}) {
  return <ContextoRanura.Provider value={ranura}>{children}</ContextoRanura.Provider>;
}

export function RanuraPanelLateral({
  refRanura,
}: {
  readonly refRanura: (el: HTMLElement | null) => void;
}) {
  return <div ref={refRanura} className="sticky top-0 h-dvh shrink-0 self-start empty:hidden" />;
}

export function PanelLateral({
  id,
  title,
  icon: Icono,
  collapsed = false,
  onToggle,
  collapseLabel,
  expandLabel,
  children,
}: {
  readonly id?: string;
  /** Nombre del panel: encabezado visible y nombre accesible del `<aside>`. */
  readonly title: string;
  /** Icono de la franja contraída (es el botón que expande el panel). */
  readonly icon: LucideIcon;
  /** Contraído: solo la franja con el icono; el contenido no se pinta. */
  readonly collapsed?: boolean;
  /** Contrae o expande. Sin él (p. ej. el esqueleto de carga) no hay botones. */
  readonly onToggle?: () => void;
  /** Nombre accesible del botón que contrae el panel. */
  readonly collapseLabel?: string;
  /** Nombre accesible del botón (icono) que expande el panel. */
  readonly expandLabel?: string;
  readonly children: ReactNode;
}) {
  const ranura = useContext(ContextoRanura);
  if (ranura === null) return null;

  const claseAside = collapsed
    ? 'w-(--ui-sidebar-width-collapsed,4rem)'
    : 'w-[min(22rem,100vw)] max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-(--ui-z-dock) max-lg:shadow-lg';

  return createPortal(
    <aside
      {...(id !== undefined ? { id } : {})}
      aria-label={title}
      data-collapsed={collapsed || undefined}
      className={`bg-surface text-on-surface border-outline-variant flex h-full flex-col border-l ${claseAside}`}
    >
      <div
        className={`border-outline-variant flex h-(--ui-navbar-height,3.5rem) shrink-0 items-center gap-2 border-b px-3 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}
      >
        {collapsed ? (
          onToggle !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              startIcon={<Icono />}
              aria-label={expandLabel ?? 'Expandir'}
              aria-expanded={false}
              {...(id !== undefined ? { 'aria-controls': id } : {})}
              onClick={onToggle}
            />
          )
        ) : (
          <>
            <h2 className="truncate text-base font-bold">{title}</h2>
            {onToggle !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                startIcon={<PanelRightClose />}
                aria-label={collapseLabel ?? 'Contraer'}
                aria-expanded
                {...(id !== undefined ? { 'aria-controls': id } : {})}
                onClick={onToggle}
              />
            )}
          </>
        )}
      </div>
      {!collapsed && <div className="flex min-h-0 flex-1 flex-col p-2">{children}</div>}
    </aside>,
    ranura,
  );
}
