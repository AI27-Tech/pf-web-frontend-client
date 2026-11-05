/** Utilidades sin dependencias. Nada de dominio aqui. */

/** Concatena clases de Tailwind descartando falsy. Sustituye a clsx/cn. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Backoff exponencial con jitter completo, acotado por `maxMs`. */
export function backoffWithJitter(attempt: number, baseMs: number, maxMs: number): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** attempt);
  return Math.random() * exponential;
}

export function formatDateTime(iso: string, locale = 'es-MX'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/** Antiguedad en segundos de una marca ISO. Base de las marcas de frescura. */
export function ageInSeconds(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
}

/**
 * Recorta un texto a `maxChars` incluyendo la elipsis en la cuenta.
 *
 * La elipsis cuenta dentro del limite a proposito: el limite describe el ancho que la
 * celda puede mostrar, y un texto de `maxChars` mas un caracter extra ya no cabe. Se
 * limpian los espacios finales antes de anadirla para no producir "Hoy a las …".
 *
 * Truncar es la ultima opcion, no la primera: quien la use debe conservar el texto
 * completo accesible (por ejemplo en `title`), porque un dato cortado sin forma de
 * leerlo entero es un dato perdido.
 */
export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return '…';

  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

/**
 * Antiguedad en lenguaje natural: "hace 2 minutos", "hace 3 horas".
 *
 * Usa `Intl.RelativeTimeFormat`, asi que la traduccion y el plural los resuelve la
 * plataforma en lugar de una tabla escrita a mano. Elige la unidad mas grande que no
 * pierda sentido: por debajo del minuto dice "hace unos segundos" en vez de contar
 * segundos, porque el segundo exacto no es informacion que nadie use aqui.
 */
export function formatRelativeTime(
  iso: string,
  now: number = Date.now(),
  locale = 'es-MX',
): string {
  const segundos = ageInSeconds(iso, now);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (segundos < 60) return 'hace unos segundos';
  if (segundos < 3600) return formatter.format(-Math.floor(segundos / 60), 'minute');
  if (segundos < 86_400) return formatter.format(-Math.floor(segundos / 3600), 'hour');

  return formatter.format(-Math.floor(segundos / 86_400), 'day');
}
