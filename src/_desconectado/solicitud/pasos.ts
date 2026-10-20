/*
 * Definicion compartida de los pasos del asistente "Solicitar nuevo servicio".
 *
 * Vive aparte porque tres piezas dependen de la MISMA lista y su orden: el stepper que
 * la pinta, el wizard que decide que renderiza, y `validateSearch` de la ruta que
 * acota el search param `?paso=`. Tener una sola fuente evita que se desincronicen.
 */

import type { OpcionCatalogo } from './tipos';

/** Los cuatro pasos visibles en el stepper, en orden. */
export const PASOS_VISIBLES = ['servicio', 'ruta', 'detalles', 'revisar'] as const;

export type PasoVisible = (typeof PASOS_VISIBLES)[number];

/**
 * Todos los valores validos del search param. `enviada` es la pantalla de
 * confirmacion: es un estado del flujo, pero NO se muestra en el stepper.
 */
export type PasoSolicitud = PasoVisible | 'enviada';

/** Etiqueta visible de cada paso del stepper. */
export const ETIQUETA_PASO: Record<PasoVisible, string> = {
  servicio: 'Servicio y Fecha',
  ruta: 'Ruta',
  detalles: 'Detalles',
  revisar: 'Revisar',
};

/** ¿Es `valor` un paso valido del search param? Se usa en `validateSearch`. */
export function esPasoValido(valor: unknown): valor is PasoSolicitud {
  return (
    valor === 'servicio' ||
    valor === 'ruta' ||
    valor === 'detalles' ||
    valor === 'revisar' ||
    valor === 'enviada'
  );
}

/**
 * Catalogos que el asistente necesita para pintar sus desplegables y casillas. Se
 * pasan por props a los pasos.
 */
export interface CatalogosSolicitud {
  readonly tiposServicio: readonly OpcionCatalogo[];
  readonly prioridades: readonly OpcionCatalogo[];
  readonly categorias: readonly OpcionCatalogo[];
  readonly rangosValor: readonly OpcionCatalogo[];
  readonly requisitos: readonly OpcionCatalogo[];
}
