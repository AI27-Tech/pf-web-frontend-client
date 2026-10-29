/*
 * Barrel de los tipos de contrato. El resto de la app importa DESDE AQUI, nunca
 * desde los archivos internos — lo fuerza `no-restricted-imports` en eslint.config.js.
 *
 * Razon: todos estos archivos son PROVISIONALES y van a ser sustituidos por codigo
 * generado desde contracts/. Con un solo punto de entrada, esa sustitucion es un
 * cambio en lib/; sin el, es un cambio en cada import de la app.
 */

export { EstadoViaje, ESTADOS_VIAJE, esTerminal, ESTADO_INICIAL, esEstadoViaje } from './estados';

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

/*
 * NOTA (recorte al contrato): los tipos del panel de control
 * (PanelDeControl, ViajeEnCurso, indicadores, NivelRiesgo, SeveridadNotificacion,
 * NotificacionPanel) y `CondicionActiva` se desconectaron del barrel: el contrato bff
 * no define la superficie del panel. Sus tipos locales viven en
 * src/_desconectado/panel/tipos.ts. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

export type {
  ViajeResumen,
  ViajeSeguimiento,
  HitoCliente,
  IncidenciaCurada,
  CrearViajeEntrada,
  OpcionCatalogo,
  EmergenciaCliente,
  EmergenciasCliente,
  ActivarEmergenciaClienteEntrada,
  NotaEmergenciaClienteEntrada,
} from './dominio';
