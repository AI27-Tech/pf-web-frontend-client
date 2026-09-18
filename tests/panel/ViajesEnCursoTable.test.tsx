/*
 * La tabla de viajes en curso y su celda de ETA.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Eta, ViajeEnCurso } from '@/lib/contracts';
import { ausentePorDegradacion, presente, sinDato } from '@/lib/contracts';
import { ETA_MAX_CHARS } from '@/lib/constants';
import { EtaCell } from '@/features/panel/EtaCell';
import { ViajesEnCursoTable } from '@/features/panel/ViajesEnCursoTable';
import { renderConRouter } from '../support/router';

const etaPresente = (iso: string) =>
  presente<Eta>({ objetivo: 'destino', estimadoEn: iso }, '2026-09-09T12:00:00Z');

/** Hoy a las 18:30 en hora local, para que el formato relativo sea estable. */
function hoyALas(hora: number, minuto: number): string {
  const fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  return fecha.toISOString();
}

/** Campos de seguimiento en vivo que esta tabla no pinta, pero que el tipo exige. */
const telemetriaDePrueba = {
  operadorNombre: 'Operador de prueba',
  progresoPct: 50,
  estadoSeguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' } as const,
  velocidadPromedioKmh: 70,
  temperaturaCargaC: 0,
  bateriaGpsPct: 90,
};

const viajes: readonly ViajeEnCurso[] = [
  {
    viajeId: 'viaje-1',
    folio: 'AI27-000101',
    origen: 'CDMX · Vallejo',
    destino: 'Queretaro · Parque Industrial',
    estado: 'EN_RUTA',
    condicionesActivas: [],
    eta: etaPresente(hoyALas(18, 30)),
    ...telemetriaDePrueba,
  },
  {
    viajeId: 'viaje-2',
    folio: 'AI27-000102',
    origen: 'Guadalajara · El Salto',
    destino: 'Leon · Zona Franca',
    estado: 'EN_RUTA',
    condicionesActivas: [
      {
        codigo: 'RETRASADO',
        descripcion: 'Retrasado',
        desde: '2026-09-09T10:20:00Z',
      },
    ],
    eta: ausentePorDegradacion<Eta>('procesamiento no disponible', '2026-09-09T10:20:00Z'),
    ...telemetriaDePrueba,
  },
  {
    viajeId: 'viaje-3',
    folio: 'AI27-000103',
    origen: 'Monterrey · Apodaca',
    destino: 'Saltillo · Derramadero',
    estado: 'SOLICITADO',
    condicionesActivas: [],
    eta: sinDato<Eta>(),
    ...telemetriaDePrueba,
  },
];

describe('EtaCell · los tres estados del ETA', () => {
  it('un ETA presente se muestra formateado y con el texto completo en el title', () => {
    render(<EtaCell eta={etaPresente(hoyALas(18, 30))} />);

    const celda = screen.getByText('Hoy, 18:30');
    expect(celda).toHaveAttribute('title', 'Hoy, 18:30');
  });

  it('un ETA que excede el maximo se trunca y conserva el completo en el title', () => {
    render(<EtaCell eta={etaPresente(hoyALas(18, 30))} maxChars={6} />);

    const celda = screen.getByTitle('Hoy, 18:30');
    // "Hoy, " se queda sin el espacio final: la elipsis no cuelga de un hueco.
    expect(celda.textContent).toBe('Hoy,…');
    expect(celda.textContent?.length).toBeLessThanOrEqual(6);
  });

  it('la ausencia por degradacion se anuncia, con motivo, y no se confunde con vacio', () => {
    render(
      <EtaCell
        eta={ausentePorDegradacion<Eta>('procesamiento no disponible', '2026-09-09T10:20:00Z')}
      />,
    );

    const marca = screen.getByRole('status');
    expect(marca).toHaveTextContent('ETA no disponible');
    expect(marca.getAttribute('title')).toContain('procesamiento no disponible');
    // El ultimo dato conocido viaja etiquetado como viejo, nunca como actual.
    expect(marca.getAttribute('title')).toContain('no actualizado');
  });

  it('"sin dato" dice "Pendiente" y no se anuncia como degradacion', () => {
    render(<EtaCell eta={sinDato<Eta>()} />);

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('el maximo por defecto es el del design system', () => {
    // Si alguien cambia el default, esta prueba lo dice: el numero esta acordado.
    expect(ETA_MAX_CHARS).toBe(18);
  });
});

describe('ViajesEnCursoTable', () => {
  it('pinta una fila por viaje con su folio enlazado al detalle', async () => {
    renderConRouter(<ViajesEnCursoTable viajes={viajes} />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // cabecera + tres viajes

    const enlace = screen.getByRole('link', { name: 'AI27-000101' });
    expect(enlace).toHaveAttribute('href', '/viajes/viaje-1');
  });

  it('conserva la descripcion accesible de la tabla y las cabeceras de columna', async () => {
    renderConRouter(<ViajesEnCursoTable viajes={viajes} />);

    const tabla = await screen.findByRole('table');
    // La caption describe la tabla para quien no la ve; sigue siendo sr-only.
    expect(tabla).toHaveAccessibleName(/Viajes en curso de tu cuenta/i);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toStrictEqual([
      'ID Viaje',
      'Origen / Destino',
      'Estado',
      'ETA',
    ]);
  });

  it('cada fila cuenta su propia version de la verdad sobre el ETA', async () => {
    renderConRouter(<ViajesEnCursoTable viajes={viajes} />);

    expect(await screen.findByText('Hoy, 18:30')).toBeInTheDocument();
    expect(screen.getByText('ETA no disponible')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('"Ver todos" lleva al listado completo de viajes', async () => {
    renderConRouter(<ViajesEnCursoTable viajes={viajes} />);

    const verTodos = await screen.findByRole('link', { name: 'Ver todos' });
    expect(verTodos).toHaveAttribute('href', '/viajes');
  });

  it('sin viajes muestra un vacio explicativo en lugar de una tabla vacia', async () => {
    renderConRouter(<ViajesEnCursoTable viajes={[]} />);

    expect(await screen.findByText('No hay viajes en curso')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
