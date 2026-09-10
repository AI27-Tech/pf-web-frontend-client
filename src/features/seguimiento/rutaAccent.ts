/*
 * Color de acento de la barra izquierda de cada tarjeta de "Viajes Activos".
 *
 * Es puramente decorativo: distingue una tarjeta de otra a simple vista en una
 * lista, sin comunicar estado ni severidad — de eso ya se encarga
 * `EstadoSeguimientoBadge`. Por eso no se crea un rol de color nuevo en
 * `globals.css`: se reutilizan los tres roles de acento M3 que ya existen
 * (`primary`, `secondary`, `tertiary`), rotando por indice, y los tres respetan el
 * tema oscuro.
 */

const ROLES_DE_ACENTO = ['primary', 'secondary', 'tertiary'] as const;

type RolDeAcento = (typeof ROLES_DE_ACENTO)[number];

const BORDE_POR_ROL: Readonly<Record<RolDeAcento, string>> = {
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  tertiary: 'border-l-tertiary',
};

/** Clase de borde izquierdo para la tarjeta en la posicion `indice` de la lista. */
export function accentoDeRuta(indice: number): string {
  const rol = ROLES_DE_ACENTO[indice % ROLES_DE_ACENTO.length] as RolDeAcento;
  return BORDE_POR_ROL[rol];
}
