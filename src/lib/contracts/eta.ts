/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * El ETA del viaje. Vive en su propio archivo —y no en el payload de seguimiento V2—
 * porque es la unica parte del seguimiento que V1 si muestra: el ETA estimado del
 * panel y de la tarjeta del viaje (E2-HU-012). El resto del seguimiento vivo
 * (posicion, geocercas, senal, stream) es V2 y quedo aislado del release path de V1
 * (E9-T10 / F-06); ver `prototipos-v2/seguimiento-vivo/`.
 *
 * El ETA de V1 se muestra como ESTIMADO, no en vivo: lo fija el monitorista a mano,
 * no se recalcula solo, y si queda vencido se etiqueta como obsoleto en lugar de
 * ocultarse. Esa marca de obsolescencia la aporta `Fresco<Eta>` + `FreshnessMark`,
 * que por eso se conservan.
 *
 * TODO(ADR 4): la politica de colchon del ETA de cliente esta ABIERTA. El diseno
 * distingue dos numeros —el calculado y el que se muestra al cliente, `eta_cliente`,
 * que es contra el que se mide el SLA— y todavia no esta decidido cual cruza la
 * frontera. Esta interfaz modela solo el que se muestra: cuando ADR 4 cierre, puede
 * hacer falta anadir el otro y distinguirlos explicitamente.
 */

export interface Eta {
  readonly objetivo: string;
  readonly estimadoEn: string;
}
