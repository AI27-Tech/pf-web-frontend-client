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

/*
 * PROVISIONAL — el borrador del asistente "Solicitar nuevo servicio".
 *
 * NO es el body de `POST /viajes` (ese es `SolicitudViaje`, arriba): es el estado que
 * el cliente arma paso a paso ANTES de enviar. Se mantiene aparte a proposito, porque
 * el contrato real del alta de servicio todavia no existe (ver Decisiones abiertas del
 * README) y este formulario captura mas campos de los que hoy viaja `SolicitudViaje`.
 * Cuando llegue el contrato, aqui se decide que subconjunto cruza al backend.
 *
 * Todos los campos son `string` porque provienen de campos de formulario; la
 * normalizacion (a ISO, a numero, etc.) se hara en la frontera de envio cuando exista.
 */

/** Paso 1: tipo de servicio, programacion de salida y datos operativos. */
export interface DatosServicio {
  /** `id` de la familia de catalogo `tipos-servicio`. */
  readonly tipoServicio: string;
  readonly fechaSalida: string;
  readonly horaSalida: string;
  /** `id` de la familia de catalogo `prioridades-servicio`. */
  readonly prioridad: string;
  /** Referencia / No. de orden de compra. Opcional. */
  readonly referenciaOrden: string;
  readonly contactoNombre: string;
  readonly contactoTelefono: string;
}

/** Paso 2: una ubicacion (origen o destino) con sus datos de contacto y acceso. */
export interface DatosUbicacion {
  readonly nombreLugar: string;
  readonly calleNumero: string;
  readonly ciudadEstado: string;
  readonly codigoPostal: string;
  readonly contactoSitio: string;
  readonly telefonoContacto: string;
  readonly instruccionesAcceso: string;
}

/** Paso 3: informacion de la carga y requerimientos de unidad/operacion. */
export interface DatosCarga {
  /** `id` de la familia de catalogo `categorias-carga`. */
  readonly categoria: string;
  /** `id` de la familia de catalogo `rangos-valor`. */
  readonly valorEstimado: string;
  /** `id`s de la familia de catalogo `requisitos-manejo` marcados. */
  readonly requisitos: readonly string[];
  readonly requerimientosVehiculo: string;
  readonly instruccionesOperativas: string;
}

/** Paso 3: documentacion adjunta. La subida real no esta implementada. */
export interface DatosDocumentacion {
  readonly comentarios: string;
}

/** El borrador completo, agrupado por los pasos del asistente. */
export interface BorradorSolicitud {
  readonly servicio: DatosServicio;
  readonly origen: DatosUbicacion;
  readonly destino: DatosUbicacion;
  readonly carga: DatosCarga;
  readonly documentacion: DatosDocumentacion;
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
