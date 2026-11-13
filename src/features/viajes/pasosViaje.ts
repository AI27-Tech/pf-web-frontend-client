/*
 * pasosViaje — en qué paso del recorrido del cliente va un viaje.
 *
 * La máquina de estados del viaje (ADR 19) tiene 13 estados; el cliente ve un recorrido
 * de cuatro pasos: Solicitado → Confirmado → En tránsito → Entregado. Este módulo hace
 * esa traducción. Es una función pura y es el ÚNICO lugar donde vive el agrupamiento.
 *
 * DECISIÓN DE PRESENTACIÓN PENDIENTE DE VALIDAR CON PRODUCT MANAGEMENT: ninguna HU ni DEC
 * define qué estados cuentan como "Confirmado" o "Entregado". Lo que sigue es una
 * propuesta, no una regla de negocio:
 *   - Solicitado   : SOLICITADO y APROBADO (AI27 ya revisó, aún no hay unidad).
 *   - Confirmado   : ASIGNADO y APTO_PARA_SALIDA (hay escolta reservada).
 *   - En tránsito  : EN_EMBARQUE, PATRULLA_EN_CAMINO, EN_TRANSITO, EN_DESTINO, EN_DESCARGA.
 *   - Entregado    : CERRADO.
 * CANCELADO y los rechazos no son parte del recorrido: no tienen paso (`null`) y la
 * pantalla no pinta el progreso; el estado ya lo dice la etiqueta junto al título.
 */

export const PASOS_VIAJE = ['Solicitado', 'Confirmado', 'En tránsito', 'Entregado'] as const;

/** Índice (en `PASOS_VIAJE`) del paso actual del viaje, o `null` si no está en el recorrido. */
export function pasoDelViaje(estado: string): number | null {
  switch (estado) {
    case 'SOLICITADO':
    case 'APROBADO':
      return 0;
    case 'ASIGNADO':
    case 'APTO_PARA_SALIDA':
      return 1;
    case 'EN_EMBARQUE':
    case 'PATRULLA_EN_CAMINO':
    case 'EN_TRANSITO':
    case 'EN_DESTINO':
    case 'EN_DESCARGA':
      return 2;
    case 'CERRADO':
      return 3;
    default:
      return null;
  }
}

export type SituacionPaso = 'hecho' | 'actual' | 'pendiente';

/**
 * Situación de cada paso. El último paso, cuando se alcanza, queda `hecho` y no `actual`:
 * el recorrido terminó, no hay nada "en curso".
 */
export function situacionDePasos(paso: number): readonly SituacionPaso[] {
  const ultimo = PASOS_VIAJE.length - 1;
  return PASOS_VIAJE.map((_, indice): SituacionPaso => {
    if (indice < paso) return 'hecho';
    if (indice === paso) return paso === ultimo ? 'hecho' : 'actual';
    return 'pendiente';
  });
}
