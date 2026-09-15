/*
 * Primitivas de formulario del design system.
 *
 * No prueban estilo: prueban el contrato accesible (label asociado, cambio de valor,
 * estado seleccionado, inercia del placeholder de carga).
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Truck } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioCard } from '@/components/ui/RadioCard';
import { FileDropzone } from '@/components/ui/FileDropzone';

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Opción A' },
    { value: 'b', label: 'Opción B' },
  ];

  it('asocia el label y pinta las opciones con placeholder', () => {
    render(<Select label="Prioridad" options={options} placeholder="Seleccione" value="" />);

    const select = screen.getByLabelText('Prioridad');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Seleccione' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Opción A' })).toBeInTheDocument();
  });

  it('reporta el cambio de valor', () => {
    const onChange = vi.fn();
    render(<Select label="Prioridad" options={options} value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Textarea', () => {
  it('asocia el label y refleja el valor', () => {
    render(<Textarea label="Comentarios" value="hola" onChange={() => {}} />);
    expect(screen.getByLabelText('Comentarios')).toHaveValue('hola');
  });
});

describe('Checkbox', () => {
  it('se marca y reporta el cambio', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Frágil" checked={false} onChange={onChange} />);

    const casilla = screen.getByLabelText('Frágil');
    expect(casilla).not.toBeChecked();
    fireEvent.click(casilla);
    expect(onChange).toHaveBeenCalled();
  });
});

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

describe('disciplina de color · primitivas de formulario', () => {
  const COLORES_CRUDOS =
    /\b(?:bg|text|border|ring|divide|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|white|black)\b|#[0-9a-fA-F]{3,8}/;

  const fuentes = import.meta.glob(
    [
      '../../src/components/ui/Select.tsx',
      '../../src/components/ui/Textarea.tsx',
      '../../src/components/ui/Checkbox.tsx',
      '../../src/components/ui/RadioCard.tsx',
      '../../src/components/ui/FileDropzone.tsx',
      '../../src/components/ui/Input.tsx',
      '../../src/components/ui/Feedback.tsx',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  const archivos = Object.entries(fuentes);

  it('el barrido cubre las siete primitivas', () => {
    expect(archivos.length).toBe(7);
  });

  it.each(archivos)('%s no contiene colores crudos', (_ruta, contenido) => {
    const coincidencia = COLORES_CRUDOS.exec(contenido);
    expect(coincidencia?.[0] ?? null).toBeNull();
  });
});
