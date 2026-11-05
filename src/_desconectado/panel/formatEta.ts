/*
 * Presentacion del ETA como texto.
 *
 * Vive en `lib/seguimiento/` y no en el panel porque el ETA es del dominio de
 * seguimiento: la pantalla de seguimiento va a necesitar exactamente este formato, y dos
 * formatos distintos para el mismo dato es como empiezan las pantallas que no se
 * parecen entre si.
 *
 * La regla de "Hoy" y "Manana" es por DIA DE CALENDARIO, no por diferencia de horas.
 */

const TIME_FORMAT = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/*
 * Abreviaturas propias y no `Intl.DateTimeFormat({ month: 'short' })` a proposito:
 * el formato acordado es "7 Sep 2026, 18:30" — tres letras, con mayuscula inicial y
 * sin punto.
 */
const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

/** Dias transcurridos entre dos instantes, contando por fecha local. */
function daysBetween(target: Date, reference: Date): number {
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const b = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());

  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/**
 * Convierte una marca ISO en el texto del ETA.
 *
 * Devuelve, segun el dia de calendario:
 *   hoy       -> "Hoy, 18:30"
 *   manana    -> "Mañana, 09:00"
 *   cualquier -> "7 Sep 2026, 18:30"
 *
 */
export function formatEtaText(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = daysBetween(date, now);
  const time = TIME_FORMAT.format(date);

  if (days === 0) return `Hoy, ${time}`;
  if (days === 1) return `Mañana, ${time}`;

  const month = SHORT_MONTHS[date.getMonth()];
  return `${date.getDate()} ${month} ${date.getFullYear()}, ${time}`;
}
