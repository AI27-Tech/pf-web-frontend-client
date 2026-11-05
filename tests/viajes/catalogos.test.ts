/*
 * `listarTiposServicio` (E9-T4): el `bff` pagina el catálogo por cursor y el select
 * necesita la lista completa. Se fija que se sigue `cursor_siguiente` hasta `null` y que
 * el cursor viaja como query, contra un `api` de mentira.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaginaTiposServicio } from '@/lib/contracts';

const get = vi.fn();
vi.mock('@/lib/api/client', () => ({ api: { get } }));

const { listarTiposServicio } = await import('@/lib/api/catalogos');

beforeEach(() => {
  get.mockReset();
});

describe('listarTiposServicio (E9-T4)', () => {
  it('sigue el cursor hasta null y junta todas las páginas en orden', async () => {
    const p1: PaginaTiposServicio = {
      items: [{ codigo: 'a', etiqueta: 'A' }],
      cursor_siguiente: 'c2',
    };
    const p2: PaginaTiposServicio = {
      items: [{ codigo: 'b', etiqueta: 'B' }],
      cursor_siguiente: null,
    };
    get.mockResolvedValueOnce(p1).mockResolvedValueOnce(p2);

    const tipos = await listarTiposServicio();

    expect(tipos).toEqual([
      { codigo: 'a', etiqueta: 'A' },
      { codigo: 'b', etiqueta: 'B' },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, '/catalogos/tipos-servicio', {
      query: { cursor: undefined },
    });
    expect(get).toHaveBeenNthCalledWith(2, '/catalogos/tipos-servicio', {
      query: { cursor: 'c2' },
    });
  });

  it('con una sola página hace una sola llamada', async () => {
    get.mockResolvedValueOnce({ items: [], cursor_siguiente: null });

    expect(await listarTiposServicio()).toEqual([]);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
