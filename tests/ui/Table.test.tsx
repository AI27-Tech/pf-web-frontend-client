/*
 * Table: las capacidades genericas.
 *
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, type Column } from '@/components/ui/Table';

interface Row {
  readonly id: string;
  readonly name: string;
}

const columns: readonly Column<Row>[] = [
  { key: 'name', header: 'Nombre', cell: (row) => row.name },
];

function rows(count: number): readonly Row[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `fila-${index + 1}`,
    name: `Fila ${index + 1}`,
  }));
}

describe('Table · rowTone', () => {
  it('la fila marcada como error se resalta con el fondo de error', () => {
    render(
      <Table
        caption="Prueba"
        columns={columns}
        rows={rows(2)}
        rowKey={(row) => row.id}
        rowTone={(row) => (row.id === 'fila-2' ? 'error' : 'default')}
      />,
    );

    const filaError = screen.getByText('Fila 2').closest('tr');
    expect(filaError?.className).toContain('bg-error-container/40');

    const filaNormal = screen.getByText('Fila 1').closest('tr');
    expect(filaNormal?.className).not.toContain('bg-error-container/40');
  });
});

describe('Table · footer', () => {
  it('pinta el contenido del pie cuando se pasa', () => {
    render(
      <Table
        caption="Prueba"
        columns={columns}
        rows={rows(2)}
        rowKey={(row) => row.id}
        footer={<span>Pie de prueba</span>}
      />,
    );

    expect(screen.getByText('Pie de prueba')).toBeInTheDocument();
  });
});

describe('Table · pageSize', () => {
  it('recorta las filas a la pagina y navega con el pie', async () => {
    render(
      <Table
        caption="Prueba"
        columns={columns}
        rows={rows(6)}
        rowKey={(row) => row.id}
        pageSize={3}
      />,
    );

    // Pagina 1: solo las tres primeras.
    expect(screen.getByText('Fila 1')).toBeInTheDocument();
    expect(screen.getByText('Fila 3')).toBeInTheDocument();
    expect(screen.queryByText('Fila 4')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–3 de 6 registros')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pagina siguiente' }));

    // Pagina 2: las tres siguientes.
    expect(screen.queryByText('Fila 3')).not.toBeInTheDocument();
    expect(screen.getByText('Fila 4')).toBeInTheDocument();
    expect(screen.getByText('Fila 6')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 4–6 de 6 registros')).toBeInTheDocument();
  });

  it('sin pageSize no aparece la paginacion', () => {
    render(<Table caption="Prueba" columns={columns} rows={rows(6)} rowKey={(row) => row.id} />);

    expect(screen.queryByRole('navigation', { name: 'Paginacion' })).not.toBeInTheDocument();
    // Todas las filas presentes: no hay recorte.
    expect(screen.getByText('Fila 6')).toBeInTheDocument();
  });
});

describe('Table · headerTone', () => {
  it("headerTone='muted' no enmarca ni pagina: la tabla del panel sigue igual", () => {
    render(
      <Table
        caption="Prueba"
        columns={columns}
        rows={rows(2)}
        rowKey={(row) => row.id}
        headerTone="muted"
      />,
    );

    const thead = screen.getByRole('table').querySelector('thead');
    expect(thead?.className).toContain('uppercase');
    // Sin pie ni navegacion cuando no se pide paginar.
    expect(screen.queryByRole('navigation', { name: 'Paginacion' })).not.toBeInTheDocument();
  });

  it("headerTone='filled' da una banda de cabecera rellena en mayusculas", () => {
    render(
      <Table
        caption="Prueba"
        columns={columns}
        rows={rows(2)}
        rowKey={(row) => row.id}
        headerTone="filled"
      />,
    );

    const thead = screen.getByRole('table').querySelector('thead');
    expect(thead?.className).toContain('bg-surface-container-low');
    expect(thead?.className).toContain('uppercase');
  });
});

describe('Table · vacio', () => {
  it('sin filas muestra el mensaje de vacio y ninguna tabla', () => {
    render(
      <Table
        caption="Prueba"
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        emptyMessage="Nada por aqui"
      />,
    );

    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
