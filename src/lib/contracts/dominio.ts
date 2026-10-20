/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * Tipos de dominio de audiencia cliente. Los sustantivos conservan su forma
 * canonica en espanol (viaje, bitacora, conversacion) porque son el lenguaje
 * ubicuo de docs/arquitectura/ y de contracts/: traducirlos rompe la
 * correspondencia con los tipos generados que van a sustituir a este archivo.
 */

import type { components } from '@ai27-tech/contracts/openapi/bff';

import type { EstadoViaje } from './estados';

/**
 * Resumen de un viaje, en la forma que el contrato `bff` define (ViajeResumen):
 * exactamente `{ id, estado, origen }`. Nada más viaja en el listado.
 *
 * Los campos que el portal asumía antes (folio, destino, origenSitio, unidad,
 * reporteSeguridad, solicitadoEn) NO están en el contrato: se retiraron. Cuando el
 * contrato los publique, el encargado del repo los reincorpora aquí y en la tabla.
 * Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
export interface ViajeResumen {
  readonly id: string;
  readonly estado: EstadoViaje;
  readonly origen: string;
}

/*
 * NOTA (recorte al contrato): `UnidadAsignada` y `ReporteSeguridad` se retiraron
 * del historial porque el contrato `ViajeResumen` no los define. `ViajeDetalle`,
 * `CondicionActiva`, bitácora y el asistente de solicitud se reconcilian contra el
 * contrato en sus propios pasos (detalle sobre `ViajeSeguimiento`). Hasta entonces,
 * los tipos de abajo se conservan autónomos para que esas pantallas sigan
 * compilando; se tocan en su paso.
 */

/**
 * Detalle/seguimiento de un viaje, en la forma del contrato `bff` (ViajeSeguimiento):
 * hito de progreso, ETA estimado con marca de obsolescencia e incidencias curadas.
 *
 * El contrato NO expone folio, origen, destino ni "condiciones activas" en esta
 * superficie: el cliente ve la vista curada (DEC-006), no el detalle interno. La
 * incidencia curada trae categoría + estado + marca de tiempo, nunca el tipo interno.
 */
export type ViajeSeguimiento = components['schemas']['ViajeSeguimiento'];
export type HitoCliente = components['schemas']['HitoCliente'];
export type IncidenciaCurada = components['schemas']['IncidenciaCurada'];

/*
 * NOTA (recorte al contrato): `CondicionActiva` y `EntradaBitacora` se desconectaron
 * del barrel. El contrato bff no define esas superficies para el cliente. Sus tipos
 * locales viven en src/_desconectado/panel/tipos.ts y src/_desconectado/bitacora/.
 */

/**
 * Entrada de creación de un viaje, en la forma del contrato `bff` (CrearViajeEntrada):
 * `{ origen, destinos:[{nombre, numero_envio?}], cliente_id?, fecha_hora_servicio?,
 * tipo_servicio? }`. El estado inicial lo fija el servidor (SOLICITADO), no el cliente.
 *
 * El asistente rico de 4 pasos (que capturaba ~20 campos: contactos, accesos, carga,
 * documentación) se desconectó a src/_desconectado/solicitud/ porque el contrato no los
 * modela. La pantalla activa es el formulario mínimo NuevaSolicitudForm.
 * Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
export type CrearViajeEntrada = components['schemas']['CrearViajeEntrada'];

/*
 * NOTA (recorte al contrato): `ConversacionResumen`, `Mensaje` y `ReciboLectura` se
 * desconectaron del barrel: el contrato bff no expone conversación al cliente (vive en
 * mensajeria.yaml, superficie interna). Sus tipos locales están en
 * src/_desconectado/conversacion/api.ts.
 */

/** Entrada de catalogo para selects y filtros. */
export interface OpcionCatalogo {
  readonly id: string;
  readonly nombre: string;
}
