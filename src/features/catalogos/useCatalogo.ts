/*
 * Lecturas de catalogo para selects y filtros.
 *
 * `staleTime` largo a proposito: bff las sirve desde su cache en proceso, son datos de
 * baja tasa de cambio y estan destinados a presentacion. Refetch agresivo aqui solo
 * produce N+1 contra `catalogos` sin ganar nada.
 *
 * Regla que no se rompe: una lectura de catalogo NUNCA autoriza. Sirve para pintar un
 * desplegable; la verificacion de aptitud la resuelve `operacion` en su transaccion.
 */

import { useQuery } from '@tanstack/react-query';
import { listCatalogo, type FamiliaCatalogo } from '@/lib/api/catalogos';

export function useCatalogo(familia: FamiliaCatalogo) {
  return useQuery({
    queryKey: ['catalogo', familia],
    queryFn: ({ signal }) => listCatalogo(familia, signal),
    staleTime: 5 * 60_000,
  });
}
