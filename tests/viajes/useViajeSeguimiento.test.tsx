/*
 * useViajeSeguimiento: el polling HTTP del detalle del viaje (E9-T5 / AI27-24, ADR 27).
 *
 * Lo que se prueba aquí es COMPORTAMIENTO, no implementación:
 *   1. Con el dato del loader sembrado (`initialData`) y el `staleTime` de producción,
 *      el primer render NO vuelve a pedir el viaje: no parpadea ni duplica la lectura.
 *   2. El polling está configurado y CORRE: pasado el intervalo, el hook vuelve a pedir
 *      el viaje a `bff` por sí solo, y lo sigue haciendo en cada intervalo (ADR 27 §1).
 *   3. Un refetch de fondo que falla con error degradado NO tira el último dato bueno:
 *      la entrada de caché conserva el viaje ya cargado y marca el fallo aparte en su
 *      estado de error. Es exactamente el dato que la vista sigue mostrando.
 *
 * Por qué se afirma contra la caché del QueryClient y no contra `result.current`: la
 * caché es la fuente de la que el componente lee, y bajo timers falsos es el punto de
 * observación estable del ciclo de Query. El intervalo efectivo NO se afirma como
 * contrato (ADR 27 §3: la cadencia es configuración ajustable, no criterio Pass/Fail);
 * `VIAJE_POLLING_INTERVAL_MS` solo sirve para avanzar el reloj.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ViajeSeguimiento } from '@/lib/contracts';
import { ApiError } from '@/lib/api/errors';
import { VIAJE_POLLING_INTERVAL_MS } from '@/lib/constants';
import { getViaje } from '@/lib/api/viajes';
import { useViajeSeguimiento, viajeQueryKey } from '@/features/viajes/useViajeSeguimiento';

// El hook habla con `bff` solo a través de getViaje; lo sustituimos por un doble.
vi.mock('@/lib/api/viajes', () => ({ getViaje: vi.fn() }));
const getViajeMock = vi.mocked(getViaje);

function viajeFixture(etiqueta: string): ViajeSeguimiento {
  return {
    id: 'viaje-1',
    hito: { estado: 'EN_TRANSITO', etiqueta },
    eta: { valor: '2026-10-23T18:00:00Z', obsoleto: false },
    incidencias: [],
  };
}

/*
 * QueryClient de prueba que refleja la política de producción que importa aquí:
 *   - `staleTime` como el real (queryClient.ts): el dato sembrado por el loader se
 *     considera fresco, así que el mount NO refetch-ea; solo refresca el polling.
 *   - retry APAGADO: el reintento por taxonomía es del QueryClient de producción y
 *     tiene su propia prueba; aquí queremos ver el PRIMER fallo sin reintentos.
 */
function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: false } },
  });
}

function wrapperCon(client: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/** Lee la entrada de caché del viaje: el dato que la vista acabaría mostrando. */
function cacheDelViaje(client: QueryClient) {
  return client.getQueryCache().find<ViajeSeguimiento>({ queryKey: viajeQueryKey('viaje-1') });
}

/** Avanza el reloj un intervalo de polling y deja asentar el ciclo de Query. */
async function avanzarUnIntervalo() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(VIAJE_POLLING_INTERVAL_MS);
  });
}

describe('useViajeSeguimiento — polling (E9-T5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getViajeMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('con initialData y el staleTime de producción no pide nada al montar', () => {
    getViajeMock.mockResolvedValue(viajeFixture('En tránsito'));
    const client = makeClient();

    const { result } = renderHook(
      () => useViajeSeguimiento('viaje-1', viajeFixture('En tránsito (inicial)')),
      { wrapper: wrapperCon(client) },
    );

    expect(result.current.data.hito.etiqueta).toBe('En tránsito (inicial)');
    expect(getViajeMock).not.toHaveBeenCalled();
  });

  it('el polling está configurado: refresca solo al cumplirse cada intervalo', async () => {
    getViajeMock.mockResolvedValue(viajeFixture('En tránsito (refrescado)'));
    const client = makeClient();

    renderHook(() => useViajeSeguimiento('viaje-1', viajeFixture('En tránsito (inicial)')), {
      wrapper: wrapperCon(client),
    });

    expect(getViajeMock).not.toHaveBeenCalled();

    // Primer intervalo: un poll que asienta el dato nuevo en la caché.
    await avanzarUnIntervalo();
    expect(getViajeMock).toHaveBeenCalledTimes(1);
    expect(cacheDelViaje(client)?.state.data?.hito.etiqueta).toBe('En tránsito (refrescado)');

    // Segundo intervalo: otro poll. El polling es periódico, no una sola vez.
    await avanzarUnIntervalo();
    expect(getViajeMock).toHaveBeenCalledTimes(2);

    // La queryFn recibe la clave de dominio correcta.
    expect(getViajeMock).toHaveBeenLastCalledWith('viaje-1', expect.anything());
  });

  it('un refetch de fondo que falla conserva el último dato bueno y marca el fallo aparte', async () => {
    // El primer poll trae un dato bueno; el segundo falla con degradación.
    getViajeMock
      .mockResolvedValueOnce(viajeFixture('En tránsito (bueno)'))
      .mockRejectedValueOnce(new ApiError('degradado', 'bff caído', 503, null));
    const client = makeClient();

    renderHook(() => useViajeSeguimiento('viaje-1', viajeFixture('En tránsito (inicial)')), {
      wrapper: wrapperCon(client),
    });

    await avanzarUnIntervalo();
    expect(cacheDelViaje(client)?.state.data?.hito.etiqueta).toBe('En tránsito (bueno)');

    await avanzarUnIntervalo();
    const entrada = cacheDelViaje(client);
    // El fallo se registra...
    expect(entrada?.state.status).toBe('error');
    // ...pero el ÚLTIMO DATO BUENO sigue ahí: la vista no se cae al error.
    expect(entrada?.state.data?.hito.etiqueta).toBe('En tránsito (bueno)');
  });
});
