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
 */

import { api } from './client';
import type { OpcionCatalogo } from '../contracts';

/**
 * Familias de catalogo que esta app (Audiencia: Cliente) consume.
 *
 * Las cuatro ultimas alimentan los desplegables y casillas del asistente "Solicitar
 * nuevo servicio". Son datos de PRESENTACION: pintan opciones, no autorizan nada.
 */
export type FamiliaCatalogo =
  | 'rutas'
  | 'zonas'
  | 'tipos-servicio'
  | 'prioridades-servicio'
  | 'categorias-carga'
  | 'rangos-valor'
  | 'requisitos-manejo';

export async function listCatalogo(
  familia: FamiliaCatalogo,
  signal?: AbortSignal,
): Promise<readonly OpcionCatalogo[]> {
  return api.get<readonly OpcionCatalogo[]>(
    `/catalogos/${familia}`,
    signal !== undefined ? { signal } : {},
  );
}
