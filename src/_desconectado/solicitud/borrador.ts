/*
 * Estado del asistente "Solicitar nuevo servicio".
 *
 * El borrador vive en un `useReducer` dentro de `SolicitarServicioWizard`.
 */

import type {
  BorradorSolicitud,
  DatosCarga,
  DatosDocumentacion,
  DatosServicio,
  DatosUbicacion,
} from './tipos';

/** Una ubicacion (origen o destino) recien creada, con todos los campos vacios. */
const UBICACION_VACIA: DatosUbicacion = {
  nombreLugar: '',
  calleNumero: '',
  ciudadEstado: '',
  codigoPostal: '',
  contactoSitio: '',
  telefonoContacto: '',
  instruccionesAcceso: '',
};

/** El borrador en su estado inicial: todo vacio, sin requisitos marcados. */
export const BORRADOR_INICIAL: BorradorSolicitud = {
  servicio: {
    tipoServicio: '',
    fechaSalida: '',
    horaSalida: '',
    prioridad: '',
    referenciaOrden: '',
    contactoNombre: '',
    contactoTelefono: '',
  },
  origen: UBICACION_VACIA,
  destino: UBICACION_VACIA,
  carga: {
    categoria: '',
    valorEstimado: '',
    requisitos: [],
    requerimientosVehiculo: '',
    instruccionesOperativas: '',
  },
  documentacion: {
    comentarios: '',
  },
};

/*
 * Acciones del reducer. Una por seccion editable.
 */
export type AccionBorrador =
  | { readonly tipo: 'servicio'; readonly campo: keyof DatosServicio; readonly valor: string }
  | { readonly tipo: 'origen'; readonly campo: keyof DatosUbicacion; readonly valor: string }
  | { readonly tipo: 'destino'; readonly campo: keyof DatosUbicacion; readonly valor: string }
  | {
      readonly tipo: 'carga';
      readonly campo: keyof Omit<DatosCarga, 'requisitos'>;
      readonly valor: string;
    }
  | { readonly tipo: 'carga-requisito'; readonly codigo: string; readonly activo: boolean }
  | {
      readonly tipo: 'documentacion';
      readonly campo: keyof DatosDocumentacion;
      readonly valor: string;
    }
  | { readonly tipo: 'reiniciar' };

/** Aplica una accion al borrador. Puro: siempre devuelve un objeto nuevo. */
export function reducerBorrador(
  estado: BorradorSolicitud,
  accion: AccionBorrador,
): BorradorSolicitud {
  switch (accion.tipo) {
    case 'servicio':
      return { ...estado, servicio: { ...estado.servicio, [accion.campo]: accion.valor } };
    case 'origen':
      return { ...estado, origen: { ...estado.origen, [accion.campo]: accion.valor } };
    case 'destino':
      return { ...estado, destino: { ...estado.destino, [accion.campo]: accion.valor } };
    case 'carga':
      return { ...estado, carga: { ...estado.carga, [accion.campo]: accion.valor } };
    case 'carga-requisito': {
      // Marcar: anadir sin duplicar. Desmarcar: quitar. El orden no importa.
      const requisitos = accion.activo
        ? estado.carga.requisitos.includes(accion.codigo)
          ? estado.carga.requisitos
          : [...estado.carga.requisitos, accion.codigo]
        : estado.carga.requisitos.filter((codigo) => codigo !== accion.codigo);
      return { ...estado, carga: { ...estado.carga, requisitos } };
    }
    case 'documentacion':
      return {
        ...estado,
        documentacion: { ...estado.documentacion, [accion.campo]: accion.valor },
      };
    case 'reiniciar':
      return BORRADOR_INICIAL;
  }
}

export function esBorradorVacio(borrador: BorradorSolicitud): boolean {
  return borrador === BORRADOR_INICIAL;
}

/**
 * Genera un identificador de solicitud simulado, con el formato del diseno
 * `AI27-YYMMDD-NNN` (p. ej. `AI27-240918-042`). No hay backend: el ID no identifica
 * ningun registro real, solo da un acuse creible en la pantalla de confirmacion.
 * `fecha` es parametro para que la funcion sea pura y testeable.
 */
export function generarIdSolicitud(fecha: Date = new Date()): string {
  const yy = String(fecha.getFullYear() % 100).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const secuencia = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `AI27-${yy}${mm}${dd}-${secuencia}`;
}
