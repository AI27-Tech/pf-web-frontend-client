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
 * Familias de catalogo que esta app (Audiencia: Cliente) consume en V1.
 *
 * Reconciliacion con el contrato y las decisiones (E9-T4):
 *   - La UNICA familia que el portal activo consume es `tipos-servicio`, para el
 *     select opcional del alta de servicio (DEC-010 #3: el cliente PUEDE elegir el
 *     tipo; su obligatoriedad sigue sin decidirse, asi que no se fuerza).
 *   - `rutas` NO es catalogo en V1: origen y destino son texto libre (DEC-010 #1,
 *     DEC-017). `marcas`, `kit de seguridad` y `operador logistico` tambien son texto
 *     libre, no catalogo (DEC-017).
 *   - `zonas`, `prioridades-servicio`, `categorias-carga`, `rangos-valor` y
 *     `requisitos-manejo` alimentaban el asistente rico de 4 pasos, hoy desconectado
 *     en src/_desconectado/solicitud/. El portal activo no las consume, asi que se
 *     retiraron de esta union para no sugerir una superficie que nadie usa.
 *
 * TODO(contracts): el contrato `bff` (bff.yaml) NO define hoy un endpoint
 * `/catalogos/{familia}`. El select de tipo de servicio se lee contra ese path, que
 * por ahora solo responde el mock MSW. Cuando el `bff` publique el catalogo de tipos
 * de servicio para audiencia Cliente, se confirma esta familia contra el contrato
 * generado. Mientras tanto, el catalogo es NO BLOQUEANTE: si no esta disponible, el
 * alta sigue siendo usable sin el (ver loader de la ruta y el form).
 */
export type FamiliaCatalogo = 'tipos-servicio';

export async function listCatalogo(
  familia: FamiliaCatalogo,
  signal?: AbortSignal,
): Promise<readonly OpcionCatalogo[]> {
  return api.get<readonly OpcionCatalogo[]>(
    `/catalogos/${familia}`,
    signal !== undefined ? { signal } : {},
  );
}
