/*
 * HistorialHeader: el encabezado del Historial de Viajes.
 *
 * Titulo y descripcion.
 */

export function HistorialHeader() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Historial de Viajes</h1>
      <p className="text-on-surface-variant text-sm">
        Consulta los registros detallados de todas las operaciones logisticas y reportes de
        seguridad asociados.
      </p>
    </header>
  );
}
