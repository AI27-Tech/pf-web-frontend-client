/*
 * detalleLayout: la rejilla del detalle del viaje, en un solo lugar.
 *
 * La usan `ViajeDetailSection` y su esqueleto de carga (`ViajeDetailPendiente`); así los dos
 * miden lo mismo y la pantalla no cambia de forma al llegar los datos.
 */

/** Convierte al contenedor del detalle en referencia de las clases `@3xl:`. */
export const CLASE_CONTENEDOR_DETALLE = '@container';

export const CLASE_REJILLA_DETALLE =
  'grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]';
