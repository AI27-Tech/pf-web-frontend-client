/*
 * Barrel de los tipos de contrato. El resto de la app importa DESDE AQUI, nunca
 * desde los archivos internos — lo fuerza `no-restricted-imports` en eslint.config.js.
 *
 * Razon: todos estos archivos son PROVISIONALES y van a ser sustituidos por codigo
 * generado desde contracts/. Con un solo punto de entrada, esa sustitucion es un
 * cambio en lib/; sin el, es un cambio en cada import de la app.
 */

export type { EstadoViaje, CondicionActiva } from './estados';
export { ESTADO_INICIAL } from './estados';

export type { Fresco } from './freshness';
export {
  presente,
  ausentePorDegradacion,
  sinDato,
  valorSiPresente,
  requiereMarcaDeDegradacion,
} from './freshness';

export type { TransportSeq, DomainSeq } from './sequences';
export {
  toTransportSeq,
  toDomainSeq,
  transportSeqToLastEventId,
  orderByDomainSequence,
  findDomainSequenceGaps,
} from './sequences';

export type { Eta } from './eta';

export type {
  IndicadorViajesActivos,
  IndicadorRiesgoGlobal,
  IndicadorAlertas,
  NivelRiesgo,
  EstadoSeguimiento,
  ViajeEnCurso,
  SeveridadNotificacion,
  NotificacionPanel,
  PanelDeControl,
} from './panel';

export type {
  UnidadAsignada,
  ReporteSeguridad,
  ViajeResumen,
  ViajeDetalle,
  EntradaBitacora,
  SolicitudViaje,
  DatosServicio,
  DatosUbicacion,
  DatosCarga,
  DatosDocumentacion,
  BorradorSolicitud,
  ConversacionResumen,
  Mensaje,
  ReciboLectura,
  OpcionCatalogo,
} from './dominio';
