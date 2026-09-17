/*
 * Primitivas de formulario propias del portal (las que la libreria @ai27-tech/ui no
 * cubre y siguen viviendo en `src/components/ui/`).
 *
 * Los controles genericos (Select, Textarea, Checkbox, Input, Button, Table,
 * Pagination, Modal) migraron a `@ai27-tech/ui` y se prueban en el repo de la libreria;
 * aqui solo quedan `RadioCard` (tarjeta seleccionable de dominio) y `FileDropzone`
 * (placeholder inerte de subida).
 *
 * No prueban estilo: prueban el contrato accesible (nombre asociado, cambio de valor,
 * estado seleccionado, inercia del placeholder de carga).
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Truck } from 'lucide-react';
import { RadioCard } from '@/components/ui/RadioCard';
import { FileDropzone } from '@/components/ui/FileDropzone';

describe('RadioCard', () => {
  it('expone un radio con nombre accesible y refleja seleccion', () => {
    render(
      <RadioCard
        name="tipo"
        value="monitoreo-activo"
        checked
        onChange={() => {}}
        title="Monitoreo Activo"
        description="Seguimiento en tiempo real"
        icon={<Truck aria-hidden="true" />}
      />,
    );

    const radio = screen.getByRole('radio', { name: /Monitoreo Activo/ });
    expect(radio).toBeChecked();
  });

  it('reporta el value al seleccionarse', () => {
    const onChange = vi.fn();
    render(
      <RadioCard
        name="tipo"
        value="custodia-armada"
        checked={false}
        onChange={onChange}
        title="Custodia Armada"
        description="Escolta física"
        icon={<Truck aria-hidden="true" />}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Custodia Armada/ }));
    expect(onChange).toHaveBeenCalledWith('custodia-armada');
  });
});

describe('FileDropzone', () => {
  it('es un placeholder inerte: deshabilitado y con nombre accesible', () => {
    render(<FileDropzone formats="PDF, JPG, PNG (Max 10MB)" />);

    const boton = screen.getByRole('button', { name: /no disponible/i });
    expect(boton).toBeDisabled();
    expect(screen.getByText('PDF, JPG, PNG (Max 10MB)')).toBeInTheDocument();
  });
});

describe('disciplina de color · primitivas propias del portal', () => {
  // `brand` y `white`/`black` no se listan como crudos: `brand-*` es un rol de dominio
  // legado del portal (definido en globals.css) y aqui interesan los colores de escala
  // de Tailwind que se escapan del sistema de roles.
  const COLORES_CRUDOS =
    /\b(?:bg|text|border|ring|divide|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b|#[0-9a-fA-F]{3,8}/;

  const fuentes = import.meta.glob(
    [
      '../../src/components/ui/RadioCard.tsx',
      '../../src/components/ui/FileDropzone.tsx',
      '../../src/components/ui/Feedback.tsx',
      '../../src/components/ui/FreshnessMark.tsx',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  const archivos = Object.entries(fuentes);

  it('el barrido cubre las cuatro primitivas propias', () => {
    expect(archivos.length).toBe(4);
  });

  it.each(archivos)('%s no contiene colores crudos', (_ruta, contenido) => {
    const coincidencia = COLORES_CRUDOS.exec(contenido);
    expect(coincidencia?.[0] ?? null).toBeNull();
  });
});
