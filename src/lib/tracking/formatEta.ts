/*
 * Presentacion del ETA como texto.
 *
 * Vive en `lib/tracking/` y no en el panel porque el ETA es del dominio de
 * seguimiento: la pantalla de tracking va a necesitar exactamente este formato, y dos
 * formatos distintos para el mismo dato es como empiezan las pantallas que no se
 * parecen entre si.
 *
 * La regla de "Hoy" y "Manana" es por DIA DE CALENDARIO, no por diferencia de horas.
 */

const HORA = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/*
 * Abreviaturas propias y no `Intl.DateTimeFormat({ month: 'short' })` a proposito:
 * el formato acordado es "7 Sep 2026, 18:30" — tres letras, con mayuscula inicial y
 * sin punto.
 */
const MESES_ABREVIADOS = [
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
function diasDeDiferencia(objetivo: Date, referencia: Date): number {
  const a = new Date(objetivo.getFullYear(), objetivo.getMonth(), objetivo.getDate());
  const b = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());

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
export function formatEtaTexto(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso);
  const dias = diasDeDiferencia(fecha, ahora);
  const hora = HORA.format(fecha);

  if (dias === 0) return `Hoy, ${hora}`;
  if (dias === 1) return `Mañana, ${hora}`;

  const mes = MESES_ABREVIADOS[fecha.getMonth()];
  return `${fecha.getDate()} ${mes} ${fecha.getFullYear()}, ${hora}`;
}
