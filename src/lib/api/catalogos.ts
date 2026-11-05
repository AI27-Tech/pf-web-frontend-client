/*
 * Catalogos, contra `bff`.
 *
 * bff las sirve desde su cache en proceso, con TTL corto mas invalidacion por el
 * evento `catalogo.actualizado`. Consecuencias para el cliente:
 *
 *   - Son datos de PRESENTACION con obsolescencia acotada. Cachear agresivamente
 *     aqui esta bien: es a lo que estan destinados.
 *   - Una lectura de catalogo NUNCA autoriza nada. Sirve para pintar un select o un
 *     filtro; la verificacion de aptitud la resuelve `operacion` en su transaccion.
 *
 * Reconciliacion con el contrato y las decisiones (E9-T4):
 *   - La UNICA familia que el `bff` sirve al cliente en V1 es `tipos-servicio`
 *     (operacion `listarTiposServicio`), para el select opcional del alta de servicio
 *     (DEC-010 #3: el cliente PUEDE elegir el tipo; su obligatoriedad sigue sin
 *     decidirse, asi que no se fuerza). El `bff` no expone un `/catalogos/{familia}`
 *     generico: la familia va fija en la ruta.
 *   - `rutas`, `marcas`, `kit de seguridad` y `operador logistico` son texto libre,
 *     no catalogo (DEC-010 #1, DEC-017).
 */

import { api } from './client';
import type { PaginaTiposServicio, TipoServicioCliente } from '../contracts';

/**
 * Lista TODOS los tipos de servicio seleccionables. El contrato pagina por cursor
 * (`items` + `cursor_siguiente`); el select necesita la lista completa, asi que se
 * sigue el cursor hasta que llega `null`. El `bff` ya filtro a los valores `activo`.
 */
export async function listarTiposServicio(
  signal?: AbortSignal,
): Promise<readonly TipoServicioCliente[]> {
  const tipos: TipoServicioCliente[] = [];
  let cursor: string | null = null;
  do {
    const pagina: PaginaTiposServicio = await api.get<PaginaTiposServicio>(
      '/catalogos/tipos-servicio',
      { query: { cursor: cursor ?? undefined }, ...(signal !== undefined ? { signal } : {}) },
    );
    tipos.push(...pagina.items);
    cursor = pagina.cursor_siguiente;
  } while (cursor !== null);
  return tipos;
}
