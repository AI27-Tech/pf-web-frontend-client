/*
 * Documentación — SIN funcionalidad de subida todavia.
 *
 * `FileDropzone` es un placeholder inerte (no hay backend ni contrato de documentos);
 * lo unico que persiste en el borrador son los comentarios.
 */

import { FileText } from 'lucide-react';
import { Card, CardBody, FormField, Textarea } from '@ai27-tech/ui';
import { FileDropzone } from '@/components/ui/FileDropzone';

interface DocumentacionCardProps {
  readonly comentarios: string;
  readonly onComentarios: (value: string) => void;
}

export function DocumentacionCard({ comentarios, onComentarios }: DocumentacionCardProps) {
  return (
    <Card variant="outlined" padding="lg" aria-label="Documentación">
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" className="text-primary size-5" />
          <h2 className="text-on-surface text-base font-semibold">Documentación</h2>
        </div>

        <FileDropzone formats="PDF, JPG, PNG (Max 10MB)" />

        <FormField label="Comentarios sobre documentos">
          <Textarea
            value={comentarios}
            onChange={(event) => onComentarios(event.target.value)}
            placeholder="Notas sobre facturas o cartas porte…"
          />
        </FormField>
      </CardBody>
    </Card>
  );
}
