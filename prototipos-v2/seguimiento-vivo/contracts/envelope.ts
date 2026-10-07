/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/events/. Ver README.
 *
 * El sobre SSE. realtime EJECUTA sus metadatos de control; no los decide.
 *
 * Lo que el cliente hace con cada metadato (realtime, apartado (d)):
 *   - `seq`      -> solo reanudacion por Last-Event-ID. Nada mas.
 *   - `tipo`     -> despacho al handler correspondiente.
 *   - `prioridad`-> el servidor ya los escribio en orden; el cliente NO reordena.
 *   - `ttl_seg`  -> el servidor ya descarto lo expirado; el cliente NO revalida.
 *   - `dedup_key`-> el servidor ya colapso la ventana; el cliente deduplica por
 *                   IDENTIDAD DE DOMINIO, que es cosa distinta.
 *
 * El principio que sostiene esto: "el servidor lleva toda la contabilidad; el
 * cliente se mantiene tonto". Replicar la contabilidad aqui es como se introduce
 * la divergencia entre lo que el servidor cree que entrego y lo que se ve.
 */

import type { TransportSeq } from './sequences';

export type Prioridad = 'alta' | 'media' | 'baja';

/**
 * Tipos de sobre que esta app (Audiencia: Cliente) puede recibir.
 *
 * Del catalogo de realtime quedan fuera, y no por olvido:
 *   - `telemetria.alerta` -> solo audiencia interna.
 *   - `panico.disparado`  -> no viaja por el stream: es POST HTTP con reintento
 *                            agresivo, porque tiene que funcionar con el socket caido.
 */
export type TipoSobre =
  | 'posicion.actualizada'
  | 'eta.actualizado'
  | 'geocerca.evento'
  | 'viaje.estado_cambiado'
  | 'sin_senal.detectado'
  | 'incidencia.abierta'
  | 'mensaje.creado';

export interface Sobre {
  readonly seq: TransportSeq;
  readonly tipo: TipoSobre;
  readonly prioridad: Prioridad;
  readonly ttlSeg: number | null;
  readonly dedupKey: string | null;
  readonly ts: string;
  /** Sin tipar a proposito: lo interpreta el parser del dominio, no el transporte. */
  readonly payload: unknown;
}

/**
 * Senal de "estoy vivo pero no estoy recibiendo".
 *
 * Existe por el modo de falla propio de realtime: si el broker esta caido, el
 * latido sigue llegando cada 4 s, el cliente no reconecta —la conexion esta sana—
 * y no recibe nada. Un stream silencioso y vivo es indistinguible de un periodo sin
 * novedades. La mitigacion exige que el servidor pueda decirlo y que el cliente
 * degrade a polling ante esa senal.
 *
 * TODO(contracts): la FORMA de esta senal no esta especificada en
 * docs/arquitectura/. El requisito si esta ("hay que marcarlo"), el campo no.
 * Confirmar con el contrato antes de depender de este nombre.
 */
export interface SenalIngestaDegradada {
  readonly tipo: 'ingesta.degradada';
  readonly desde: string;
}
