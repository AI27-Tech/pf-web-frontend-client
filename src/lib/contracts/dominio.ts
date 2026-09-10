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

export interface ViajeResumen {
  readonly id: string;
  readonly folio: string;
  readonly estado: EstadoViaje;
  readonly origen: string;
  readonly destino: string;
  readonly solicitadoEn: string;
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
