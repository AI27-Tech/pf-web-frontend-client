/*
 * HistorialHeader: el encabezado del Historial de Viajes.
 *
 * Titulo, descripcion y el boton "Exportar CSV". El boton esta deshabilitado a
 * proposito, con su motivo en el `title`: exportar aun no tiene implementacion.
 */

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Motivo del `title` del boton, para no repetirlo. */
const MOTIVO_SIN_EXPORTAR = 'La exportacion a CSV aun no esta disponible';

export function HistorialHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Historial de Viajes</h1>
        <p className="text-on-surface-variant text-sm">
          Consulta los registros detallados de todas las operaciones logisticas y reportes de
          seguridad asociados.
        </p>
      </div>

      <Button variant="secondary" disabled title={MOTIVO_SIN_EXPORTAR} className="shrink-0">
        <Download aria-hidden="true" className="mr-2 size-4" />
        Exportar CSV
      </Button>
    </header>
  );
}
