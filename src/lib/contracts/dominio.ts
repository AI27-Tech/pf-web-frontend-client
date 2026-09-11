/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * Tipos de dominio de audiencia cliente. Los sustantivos conservan su forma
 * canonica en espanol (viaje, bitacora, conversacion) porque son el lenguaje
 * ubicuo de docs/arquitectura/ y de contracts/: traducirlos rompe la
 * correspondencia con los tipos generados que van a sustituir a este archivo.
 */

import type { CondicionActiva, EstadoViaje } from './estados';
import type { DomainSeq } from './sequences';

/**
 * La unidad asignada a un viaje: vehiculo y conductor.
 *
 * Puede no existir todavia — un viaje recien SOLICITADO aun no tiene unidad — por eso
 * en `ViajeResumen` viaja como `UnidadAsignada | null` y no como campos sueltos: "sin
 * asignar" es un estado, no tres cadenas vacias.
 *
 * TODO(contracts): confirmar nombres y forma contra contracts/openapi/bff.yaml.
 */
export interface UnidadAsignada {
  /** Marca y modelo, p. ej. "Volvo FH16". */
  readonly descripcion: string;
  /** Placa/matricula, p. ej. "AB-123". */
  readonly placa: string;
  readonly conductorNombre: string;
}

/**
 * Resultado del reporte de seguridad de un viaje.
 *
 * Union abierta, igual que `EstadoViaje`: la UI presenta los valores que conoce y
 * degrada a neutro los que no, sin inventar catalogos que el contrato no confirma.
 */
export type ReporteSeguridad = 'SIN_INCIDENCIAS' | 'CON_INCIDENCIAS' | 'PENDIENTE' | (string & {});

export interface ViajeResumen {
  readonly id: string;
  readonly folio: string;
  readonly estado: EstadoViaje;
  readonly origen: string;
  readonly destino: string;
  readonly solicitadoEn: string;
  /** Sitio concreto del origen, p. ej. "Almacen Central". Puede no venir. */
  readonly origenSitio: string | null;
  /** Sitio concreto del destino, p. ej. "Planta Industrial Sur". Puede no venir. */
  readonly destinoSitio: string | null;
  /** `null` cuando el viaje aun no tiene unidad asignada (recien SOLICITADO). */
  readonly unidad: UnidadAsignada | null;
  readonly reporteSeguridad: ReporteSeguridad;
}

/** Detalle: estado de progreso mas condiciones activas superpuestas (§C.2). */
export interface ViajeDetalle extends ViajeResumen {
  readonly condicionesActivas: readonly CondicionActiva[];
  readonly contratoId: string | null;
  readonly rutaId: string | null;
}

/** Solo la bitacora VISIBLE al cliente. La auditoria probatoria es de operacion. */
export interface EntradaBitacora {
  readonly id: string;
  readonly ocurrioEn: string;
  readonly descripcion: string;
}

export interface SolicitudViaje {
  readonly origen: string;
  readonly destino: string;
  readonly requeridoEn: string;
  readonly notas: string;
}

export interface ConversacionResumen {
  readonly id: string;
  readonly asunto: string;
  readonly viajeId: string | null;
  readonly ultimoMensajeEn: string | null;
  readonly noLeidos: number;
}

export interface Mensaje {
  readonly id: string;
  /** Secuencia DE DOMINIO: es la que ordena en pantalla. */
  readonly seq: DomainSeq;
  readonly cuerpo: string;
  readonly enviadoEn: string;
  readonly deCliente: boolean;
}

/**
 * Un recibo publico no filtra operacion (P23): sin miembro de pool, sin claimant,
 * sin supervisor y sin metadata de cola. Si algun dia aparece uno de esos campos
 * aqui, es una fuga.
 */
export interface ReciboLectura {
  readonly mensajeId: string;
  readonly leidoEn: string;
}

/** Entrada de catalogo para selects y filtros. */
export interface OpcionCatalogo {
  readonly id: string;
  readonly nombre: string;
}
