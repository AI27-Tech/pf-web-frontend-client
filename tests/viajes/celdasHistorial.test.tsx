/*
 * Las celdas de dominio del Historial de Viajes.
 *
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UnidadAsignada } from '@/lib/contracts';
import { RutaCell } from '@/features/viajes/historial/RutaCell';
import { UnidadCell } from '@/features/viajes/historial/UnidadCell';
import { ReporteSeguridadCell } from '@/features/viajes/historial/ReporteSeguridadCell';

const unidad: UnidadAsignada = {
  descripcion: 'Volvo FH16',
  placa: 'AB-123',
  conductorNombre: 'Juan Perez',
};

describe('RutaCell', () => {
  it('pinta origen y destino con sus sitios concretos', () => {
    render(
      <RutaCell
        origen="CDMX (Norte)"
        origenSitio="Almacen Central"
        destino="Monterrey"
        destinoSitio="Planta Industrial Sur"
      />,
    );

    expect(screen.getByText('CDMX (Norte)')).toBeInTheDocument();
    expect(screen.getByText('Almacen Central')).toBeInTheDocument();
    expect(screen.getByText('Monterrey')).toBeInTheDocument();
    expect(screen.getByText('Planta Industrial Sur')).toBeInTheDocument();
  });

  it('omite la linea del sitio cuando no viene, sin dejar hueco', () => {
    render(<RutaCell origen="CDMX" origenSitio={null} destino="Monterrey" destinoSitio={null} />);

    expect(screen.getByText('CDMX')).toBeInTheDocument();
    expect(screen.getByText('Monterrey')).toBeInTheDocument();
    // No hay sitios: solo dos textos, los lugares.
    expect(screen.queryByText('Almacen Central')).not.toBeInTheDocument();
  });
});

describe('UnidadCell', () => {
  it('muestra vehiculo, placa y conductor', () => {
    render(<UnidadCell unidad={unidad} />);

    expect(screen.getByText('Volvo FH16 (AB-123)')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('sin unidad asignada dice "Sin asignar" en vez de fingir un vehiculo', () => {
    render(<UnidadCell unidad={null} />);

    expect(screen.getByText('Sin asignar')).toBeInTheDocument();
  });
});

describe('ReporteSeguridadCell', () => {
  it('sin incidencias se anuncia con texto, no solo con color', () => {
    render(<ReporteSeguridadCell reporte="SIN_INCIDENCIAS" />);

    expect(screen.getByText('Sin incidencias')).toBeInTheDocument();
    expect(screen.getByTitle('Sin incidencias')).toBeInTheDocument();
  });

  it('con incidencias se anuncia con texto', () => {
    render(<ReporteSeguridadCell reporte="CON_INCIDENCIAS" />);

    expect(screen.getByText('Con incidencias')).toBeInTheDocument();
    expect(screen.getByTitle('Con incidencias')).toBeInTheDocument();
  });

  it('pendiente se anuncia con texto', () => {
    render(<ReporteSeguridadCell reporte="PENDIENTE" />);

    expect(screen.getByText('Reporte pendiente')).toBeInTheDocument();
  });

  it('un valor desconocido no rompe: se muestra su codigo en neutro', () => {
    render(<ReporteSeguridadCell reporte="ALGO_NUEVO" />);

    // El codigo crudo avisa de que falta mapearlo, en vez de fingir un resultado.
    expect(screen.getByText('ALGO_NUEVO')).toBeInTheDocument();
  });
});
