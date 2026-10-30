/*
 * El formato del ETA y su truncado.
 *
 * El ETA es la columna mas estrecha de la tabla y la que mas varia de longitud: "Hoy,
 * 18:30" son 10 caracteres y "17 Sep 2026, 18:30" son 19. Sin un limite, la columna
 * baila con los datos; con un limite mal elegido, el limite corta un dato legitimo. De
 * ahi que `ETA_MAX_CHARS` sea exactamente el caso mas largo del formato acordado, y no
 * un numero redondo.
 */

import { describe, expect, it } from 'vitest';
import { ETA_MAX_CHARS } from '@/lib/constants';
import { formatEtaText } from '@/_desconectado/panel/formatEta';
import { truncate } from '@/lib/utils';

/** Fecha de referencia fija: el formato es relativo, asi que el "ahora" importa. */
const AHORA = new Date('2026-09-09T12:00:00');

describe('formatEtaTexto', () => {
  it('el mismo dia se dice "Hoy" con la hora', () => {
    const texto = formatEtaText(new Date('2026-09-09T18:30:00').toISOString(), AHORA);

    expect(texto).toBe('Hoy, 18:30');
  });

  it('el dia siguiente se dice "Manana" con la hora', () => {
    const texto = formatEtaText(new Date('2026-09-10T09:00:00').toISOString(), AHORA);

    expect(texto).toBe('Mañana, 09:00');
  });

  it('mas alla de manana se da la fecha abreviada, sin cero inicial en el dia', () => {
    const texto = formatEtaText(new Date('2026-04-24T12:00:00').toISOString(), AHORA);

    // El formato acordado: dia sin cero inicial, mes de tres letras, ano completo.
    expect(texto).toBe('24 Abr 2026, 12:00');
  });

  it('el caso mas largo del formato cabe justo en el limite', () => {
    // Dia de dos cifras: es el peor caso, todos los meses abreviados pesan igual.
    const texto = formatEtaText(new Date('2026-09-17T18:30:00').toISOString(), AHORA);

    expect(texto).toBe('17 Sep 2026, 18:30');
    expect(texto).toHaveLength(ETA_MAX_CHARS);
    // Y por tanto no se trunca: el limite existe para lo que se sale de la plantilla.
    expect(truncate(texto, ETA_MAX_CHARS)).toBe(texto);
  });

  it('el dia anterior no se disfraza de hoy', () => {
    const texto = formatEtaText(new Date('2026-09-08T23:00:00').toISOString(), AHORA);

    // "Hoy" se decide por dia de calendario, no por diferencia de horas: un ETA de
    // hace trece horas es de ayer, y decir "Hoy" seria mentir sobre el dia.
    expect(texto).toBe('8 Sep 2026, 23:00');
  });

  it('un dia de una sola cifra no lleva cero inicial', () => {
    const texto = formatEtaText(new Date('2026-04-05T09:00:00').toISOString(), AHORA);

    expect(texto).toBe('5 Abr 2026, 09:00');
  });
});

describe('truncate', () => {
  it('deja intacto lo que cabe', () => {
    expect(truncate('Pendiente', ETA_MAX_CHARS)).toBe('Pendiente');
  });

  it('corta con puntos suspensivos y nunca excede el maximo', () => {
    const largo = 'Miercoles 24 de septiembre de 2026 a las 12:00 horas';
    const cortado = truncate(largo, ETA_MAX_CHARS);

    // El caracter de elipsis cuenta dentro del limite: el limite es el ancho real.
    expect(cortado.length).toBeLessThanOrEqual(ETA_MAX_CHARS);
    expect(cortado.endsWith('…')).toBe(true);
  });

  it('no deja un espacio suelto antes de la elipsis', () => {
    // El corte cae justo en un espacio: sin `trimEnd` saldria "Hoy a las …".
    expect(truncate('Hoy a las 18:30', 11)).toBe('Hoy a las…');
  });
});
