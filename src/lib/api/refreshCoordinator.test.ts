import { describe, expect, it, vi } from 'vitest';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock('./sesion', () => ({ refresh: refreshMock }));

import { refrescarSesionCoordinado } from './refreshCoordinator';

describe('refreshCoordinator cliente', () => {
  it('comparte una sola promesa entre solicitudes concurrentes', async () => {
    let resolver: ((value: { sesionId: string }) => void) | undefined;
    refreshMock.mockReturnValue(
      new Promise<{ sesionId: string }>((resolve) => {
        resolver = resolve;
      }),
    );

    const primero = refrescarSesionCoordinado();
    const segundo = refrescarSesionCoordinado();
    resolver?.({ sesionId: 'ses-1' });

    await expect(Promise.all([primero, segundo])).resolves.toEqual([
      { sesionId: 'ses-1' },
      { sesionId: 'ses-1' },
    ]);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
