const ACCENT_ROLES = ['primary', 'secondary', 'tertiary'] as const;

type AccentRole = (typeof ACCENT_ROLES)[number];

const BORDER_BY_ROLE: Readonly<Record<AccentRole, string>> = {
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  tertiary: 'border-l-tertiary',
};

/** Clase de borde izquierdo para la tarjeta en la posicion `index` de la lista. */
export function routeAccentClass(index: number): string {
  const role = ACCENT_ROLES[index % ACCENT_ROLES.length] as AccentRole;
  return BORDER_BY_ROLE[role];
}
