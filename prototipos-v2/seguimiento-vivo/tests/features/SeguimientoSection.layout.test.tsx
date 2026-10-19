/*
 * Layout responsivo de Seguimiento en Vivo y disciplina de color.
 *
 * jsdom no aplica media queries, asi que la unica forma de afirmar en una prueba
 * unitaria que el layout cambia por breakpoint es comprobar que las clases
 * responsivas estan puestas.
 *
 * PROTOTIPO V2 (NO productivo): archivado con la superficie de seguimiento en vivo en
 * E9-T10 / F-06. Vitest no corre `prototipos-v2/`.
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ViajeEnCurso } from '../../features/viaje-activo';
import { SeguimientoSection } from '../../features/SeguimientoSection';
import { renderConRouter } from './router';
import { viajeBase } from './fixtures';

const viajes: readonly ViajeEnCurso[] = [viajeBase];

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

  const fuentesDeSeguimiento = import.meta.glob('../../features/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const archivos = Object.entries(fuentesDeSeguimiento);

  it.each(archivos)('%s no contiene colores crudos', (_ruta, contenido) => {
    const coincidencia = COLORES_CRUDOS.exec(contenido);

    expect(coincidencia?.[0] ?? null).toBeNull();
  });

  it('el barrido cubre todo el directorio de features del prototipo', () => {
    expect(Object.keys(fuentesDeSeguimiento).length).toBeGreaterThanOrEqual(6);
  });
});
