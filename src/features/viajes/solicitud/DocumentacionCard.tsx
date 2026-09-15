/*
 * Documentación — SIN funcionalidad de subida todavia.
 *
 * `FileDropzone` es un placeholder inerte (no hay backend ni contrato de documentos);
 * lo unico que persiste en el borrador son los comentarios.
 */

import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { FileDropzone } from '@/components/ui/FileDropzone';

interface DocumentacionCardProps {
  readonly comentarios: string;
  readonly onComentarios: (value: string) => void;
}

export function DocumentacionCard({ comentarios, onComentarios }: DocumentacionCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-5" ariaLabel="Documentación">
      <div className="flex items-center gap-2">
        <FileText aria-hidden="true" className="text-primary size-5" />
        <h2 className="text-on-surface text-base font-semibold">Documentación</h2>
      </div>

      <FileDropzone formats="PDF, JPG, PNG (Max 10MB)" />

      <Textarea
        label="Comentarios sobre documentos"
        value={comentarios}
        onChange={(event) => onComentarios(event.target.value)}
        placeholder="Notas sobre facturas o cartas porte…"
      />
    </Card>
  );
}
