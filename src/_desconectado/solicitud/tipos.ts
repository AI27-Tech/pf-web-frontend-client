/*
 * Tipos del asistente de solicitud — DESCONECTADO (recorte al contrato, E8-T3).
 *
 * El asistente de 4 pasos captura ~20 campos; el contrato `CrearViajeEntrada` acepta
 * solo { origen, destinos[], tipo_servicio?, fecha_hora_servicio?, cliente_id? }. El
 * asistente completo se conservó aquí (desconectado del enrutado) para reconectar
 * cuando el contrato soporte el formulario completo; la pantalla activa es el
 * formulario mínimo en features/viajes/NuevaSolicitudForm.tsx.
 *
 * Por eso estos tipos son LOCALES y provisionales, fuera de @/lib/contracts: el barrel
 * de contratos solo debe contener lo que el contrato real define.
 *
 * Todos los campos son `string` porque provienen de campos de formulario; la
 * normalización se haría en la frontera de envío cuando exista el contrato.
 */

/** Entrada de catálogo para selects y casillas del asistente. */
export interface OpcionCatalogo {
  readonly id: string;
  readonly nombre: string;
}

/** Paso 1: tipo de servicio, programación de salida y datos operativos. */
export interface DatosServicio {
  readonly tipoServicio: string;
  readonly fechaSalida: string;
  readonly horaSalida: string;
  readonly prioridad: string;
  readonly referenciaOrden: string;
  readonly contactoNombre: string;
  readonly contactoTelefono: string;
}

/** Paso 2: una ubicación (origen o destino) con sus datos de contacto y acceso. */
export interface DatosUbicacion {
  readonly nombreLugar: string;
  readonly calleNumero: string;
  readonly ciudadEstado: string;
  readonly codigoPostal: string;
  readonly contactoSitio: string;
  readonly telefonoContacto: string;
  readonly instruccionesAcceso: string;
}

/** Paso 3: información de la carga y requerimientos de unidad/operación. */
export interface DatosCarga {
  readonly categoria: string;
  readonly valorEstimado: string;
  readonly requisitos: readonly string[];
  readonly requerimientosVehiculo: string;
  readonly instruccionesOperativas: string;
}

/** Paso 3: documentación adjunta. */
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
