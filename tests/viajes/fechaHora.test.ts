/*
 * fechaHora — combina los campos Fecha y Hora en el `fecha_hora_servicio` del contrato.
 *
 * El contrato (`MarcaTiempo`) pide un instante en UTC, RFC 3339. La fecha y la hora que
 * captura el cliente son la hora de pared de su navegador, así que el valor esperado se
 * construye con `new Date(año, mes, día, h, m)` (zona local) y se compara contra su
 * `toISOString()`: la prueba no depende de la zona horaria de quien la corre.
 */
import { describe, expect, it } from 'vitest';
import { resolverFechaHora } from '@/features/viajes/fechaHora';

describe('resolverFechaHora', () => {
  it('sin fecha ni hora es válido y no aporta valor', () => {
    expect(resolverFechaHora('', '')).toEqual({ estado: 'vacio' });
  });

  it('con fecha y hora arma el instante en UTC (RFC 3339)', () => {
    const resultado = resolverFechaHora('2026-11-20', '09:30');
    const esperado = new Date(2026, 10, 20, 9, 30, 0, 0).toISOString();

    expect(resultado).toEqual({ estado: 'valido', iso: esperado });
    // Forma que el backend espera: UTC, con designador `Z`.
    expect(esperado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });

  it('con solo la fecha, o solo la hora, queda incompleto y dice qué falta', () => {
    expect(resolverFechaHora('2026-11-20', '')).toEqual({ estado: 'incompleto', falta: 'hora' });
    expect(resolverFechaHora('', '09:30')).toEqual({ estado: 'incompleto', falta: 'fecha' });
  });

  it('rechaza un año de 5 o 6 dígitos', () => {
    expect(resolverFechaHora('20266-11-20', '09:30')).toEqual({ estado: 'invalido' });
    expect(resolverFechaHora('275760-09-13', '00:00')).toEqual({ estado: 'invalido' });
  });

  it('rechaza una fecha inexistente en lugar de moverla a otro día', () => {
    expect(resolverFechaHora('2026-02-31', '09:30')).toEqual({ estado: 'invalido' });
  });

  it('rechaza una hora fuera de rango', () => {
    expect(resolverFechaHora('2026-11-20', '25:00')).toEqual({ estado: 'invalido' });
  });

  it('acepta un año de 4 dígitos con ceros a la izquierda sin reinterpretarlo', () => {
    const resultado = resolverFechaHora('0999-01-01', '00:00');
    expect(resultado.estado).toBe('valido');
  });

  it('no rechaza fechas pasadas: la HU no define esa regla', () => {
    expect(resolverFechaHora('2020-01-01', '08:00').estado).toBe('valido');
  });

  it('rechaza texto que no es fecha ni hora', () => {
    expect(resolverFechaHora('hoy', '09:30')).toEqual({ estado: 'invalido' });
    expect(resolverFechaHora('2026-11-20', 'tarde')).toEqual({ estado: 'invalido' });
  });
});
