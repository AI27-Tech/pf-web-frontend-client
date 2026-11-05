/*
 * listViajes: el filtrado por estado es del SERVIDOR (E9-T3 / AI27-22).
 *
 * Lo que se prueba aquí es el CONTRATO de la llamada, no el render: que `listViajes`
 * manda (o no) el query param `estado` a `GET /viajes` según el filtro, y que "en
 * curso" (SOLICITADO, EN_TRANSITO) y "cerrado" (CERRADO) producen llamadas distintas.
 *
 * Regla de seguridad (P9, P10): el alcance de tenant lo deriva bff del token. Aquí se
 * afirma que NINGUNA llamada mete `tenantId` ni nada derivado del token en la query.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoViaje } from '@/lib/contracts';
import { listViajes } from '@/lib/api/viajes';
import { api } from '@/lib/api/client';

// `listViajes` habla con bff solo a través de `api.get`; lo sustituimos por un doble.
vi.mock('@/lib/api/client', () => ({ api: { get: vi.fn() } }));
const getMock = vi.mocked(api.get);

/** Las options (2º argumento) con las que se llamó a `api.get('/viajes', ...)`. */
function opcionesDeLaLlamada() {
  const [path, options] = getMock.mock.calls[0] ?? [];
  expect(path).toBe('/viajes');
  return (options ?? {}) as { query?: Record<string, string> };
}

describe('listViajes — filtro por estado (E9-T3)', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue([]);
  });

  it('sin filtro NO manda el query param `estado`: bff devuelve todo el alcance', async () => {
    await listViajes();

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(opcionesDeLaLlamada().query).toBeUndefined();
  });

  it('con un estado "en curso" manda ese `estado` como query param', async () => {
    await listViajes({ estado: EstadoViaje.EnTransito });

    expect(opcionesDeLaLlamada().query).toStrictEqual({ estado: 'EN_TRANSITO' });
  });

  it('"en curso" y "cerrado" producen llamadas con `estado` distinto', async () => {
    await listViajes({ estado: EstadoViaje.EnTransito });
    const enCurso = opcionesDeLaLlamada().query;

    getMock.mockClear();
    await listViajes({ estado: EstadoViaje.Cerrado });
    const cerrado = opcionesDeLaLlamada().query;

    expect(enCurso).toStrictEqual({ estado: 'EN_TRANSITO' });
    expect(cerrado).toStrictEqual({ estado: 'CERRADO' });
    expect(enCurso).not.toStrictEqual(cerrado);
  });

  it('nunca mete tenant ni nada derivado del token en la query (P9, P10)', async () => {
    await listViajes({ estado: EstadoViaje.Cerrado });

    const query = opcionesDeLaLlamada().query ?? {};
    expect(Object.keys(query)).toStrictEqual(['estado']);
    expect(query).not.toHaveProperty('tenantId');
    expect(query).not.toHaveProperty('tenant_id');
  });
});
