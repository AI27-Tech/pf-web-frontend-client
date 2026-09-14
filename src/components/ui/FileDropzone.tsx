/*
 * Zona de carga de archivos — PLACEHOLDER inerte.
 *
 * La subida real no esta implementada (no hay backend ni contrato de documentacion).
 */

import { UploadCloud } from 'lucide-react';
import { cx } from '@/lib/utils';

interface FileDropzoneProps {
  /** Formatos y limite a mostrar, p. ej. "PDF, JPG, PNG (Max 10MB)". */
  readonly formatos?: string;
  readonly className?: string;
}

export function FileDropzone({ formatos, className }: FileDropzoneProps) {
  return (
    <button
      type="button"
      // Inerte a proposito: sin funcionalidad hasta que exista el contrato de documentacion.
      disabled
      aria-label="Cargar documentos (no disponible todavía)"
      className={cx(
        'border-outline-variant text-on-surface-variant flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center',
        'disabled:cursor-not-allowed',
        className,
      )}
    >
      <UploadCloud aria-hidden="true" className="size-8" />
      <span className="text-on-surface text-sm font-medium">Arrastre archivos aquí</span>
      <span className="text-xs">o haga clic para seleccionar</span>
      {formatos !== undefined && (
        <span className="bg-surface-container text-on-surface-variant mt-1 rounded-full px-2 py-0.5 text-[11px]">
          {formatos}
        </span>
      )}
    </button>
  );
}
