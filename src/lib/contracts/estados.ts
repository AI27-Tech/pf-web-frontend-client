/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/estados/. Ver README.
 *
 * Los estados de viaje son "dato unico" (P14): se generan desde el contrato, no se
 * declaran en cada servicio. Este archivo es un marcador de posicion para que el
 * resto del scaffold compile; los valores exactos y la maquina de estados completa
 * son de `operacion` y NO estan documentados en detalle en docs/arquitectura/.
 *
 * Lo unico confirmado por la documentacion (bff, apartado (f) · §C.1):
 *   una solicitud de servicio entra en SOLICITADO.
 *
 * TODO(contracts): reemplazar por el enum generado. No anadir estados por
 * suposicion: un estado inventado aqui es un `switch` que compila y miente.
 */

export const ESTADO_INICIAL = 'SOLICITADO' as const;

/**
 * Union abierta a proposito: `string` mantiene el resto de estados representables
 * sin inventarlos, y conserva el autocompletado del unico que conocemos. Cuando
 * llegue el contrato, esto pasa a ser una union cerrada y el compilador senalara
 * cada sitio que asumia algo.
 */
export type EstadoViaje = typeof ESTADO_INICIAL | (string & {});

/** Una condicion activa se superpone al estado de progreso (§C.2). */
export interface CondicionActiva {
  readonly codigo: string;
  readonly descripcion: string;
  readonly desde: string;
}
