/*
 * Layout responsivo de Seguimiento en Vivo y disciplina de color.
 *
 * jsdom no aplica media queries, asi que la unica forma de afirmar en una prueba
 * unitaria que el layout cambia por breakpoint es comprobar que las clases
 * responsivas estan puestas.
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { Eta, ViajeEnCurso } from '@/lib/contracts';
import { presente } from '@/lib/contracts';
import { SeguimientoSection } from '@/features/seguimiento/SeguimientoSection';
import { renderConRouter } from '../support/router';

const viajes: readonly ViajeEnCurso[] = [
  {
    viajeId: 'viaje-1',
    folio: 'AI27-000101',
    origen: 'CDMX',
    destino: 'Monterrey',
    estado: 'EN_RUTA',
    condicionesActivas: [],
    eta: presente<Eta>(
      { objetivo: 'destino', estimadoEn: '2026-09-09T18:30:00Z' },
      '2026-09-09T12:00:00Z',
    ),
    operadorNombre: 'Carlos R.',
    progresoPct: 65,
    estadoSeguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' },
    velocidadPromedioKmh: 78,
    temperaturaCargaC: -4,
    bateriaGpsPct: 92,
  },
];

describe('SeguimientoSection · layout responsive', () => {
  it('la lista y la columna del mapa se apilan en movil y van lado a lado en xl, la lista mas angosta', async () => {
    const { container } = renderConRouter(<SeguimientoSection viajes={viajes} />);
    await screen.findByRole('region', { name: 'Vista de mapa' });

    const raiz = filaPrincipal(container);
    expect(raiz).toBeDefined();
    expect(raiz?.className).toContain('flex-col');
    expect(raiz?.className).toContain('xl:flex-row');
    expect(raiz?.querySelector('.xl\\:w-1\\/3')).not.toBeNull();
  });

  it('la lista de viajes activos precede al mapa en el orden de lectura', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    const listaViajes = await screen.findByRole('region', { name: 'Viajes activos' });
    const mapa = screen.getByRole('region', { name: 'Vista de mapa' });

    /*
     * El orden del DOM es el orden de lectura en movil. Si alguien recolocara con
     * `order-*`, lo que se ve y lo que se lee dejarian de coincidir, y este test lo
     * detecta: DOCUMENT_POSITION_FOLLOWING deja de cumplirse.
     */
    expect(listaViajes.compareDocumentPosition(mapa)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('la barra de telemetria va debajo del mapa, en la misma columna, no junto a la lista', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    const listaViajes = await screen.findByRole('region', { name: 'Viajes activos' });
    const telemetria = screen.getByRole('region', { name: 'Telemetria del viaje seleccionado' });
    const mapa = screen.getByRole('region', { name: 'Vista de mapa' });

    expect(mapa.compareDocumentPosition(telemetria)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(listaViajes.parentElement).not.toBe(telemetria.parentElement);
  });
});

function filaPrincipal(container: HTMLElement): Element | null {
  return (
    [...container.querySelectorAll('.flex')].find((nodo) =>
      nodo.className.includes('xl:flex-row'),
    ) ?? null
  );
}

describe('SeguimientoSection · disciplina de colors', () => {
  const COLORES_CRUDOS =
    /\b(?:bg|text|border|ring|divide|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|white|black)\b|#[0-9a-fA-F]{3,8}/;

  const fuentesDeSeguimiento = import.meta.glob('../../src/features/seguimiento/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const archivos = Object.entries(fuentesDeSeguimiento);

  it.each(archivos)('%s no contiene colores crudos', (_ruta, contenido) => {
    const coincidencia = COLORES_CRUDOS.exec(contenido);

    // Un color crudo no cambia al anadir `.dark` al <html>: el componente se quedaria
    // en tema claro dentro de una app en oscuro.
    expect(coincidencia?.[0] ?? null).toBeNull();
  });

  it('el barrido cubre todo el directorio de seguimiento', () => {
    // Si el comodin dejara de resolver, el barrido pasaria en verde sin revisar nada.
    expect(Object.keys(fuentesDeSeguimiento).length).toBeGreaterThanOrEqual(6);
  });
});
