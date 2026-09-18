/*
 * La composicion del panel: layout responsive y disciplina de color.
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { Eta, PanelDeControl } from '@/lib/contracts';
import { ausentePorDegradacion, presente, sinDato } from '@/lib/contracts';
import { PanelSection } from '@/features/panel/PanelSection';
import { renderConRouter } from '../support/router';

/** Campos de seguimiento en vivo que el panel no pinta, pero que el tipo exige. */
const telemetriaDePrueba = {
  operadorNombre: 'Operador de prueba',
  progresoPct: 50,
  estadoSeguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' } as const,
  velocidadPromedioKmh: 70,
  temperaturaCargaC: 0,
  bateriaGpsPct: 90,
};

const panel: PanelDeControl = {
  viajesActivos: { total: 24, deltaDesdeAyer: 3 },
  riesgoGlobal: { nivel: 'BAJO_NORMAL', unidadesSegurasPct: 98 },
  alertasActivas: { total: 2 },
  viajesEnCurso: [
    {
      viajeId: 'viaje-1',
      folio: 'AI27-000101',
      origen: 'CDMX · Vallejo',
      destino: 'Queretaro · Parque Industrial',
      estado: 'EN_RUTA',
      condicionesActivas: [],
      eta: presente<Eta>(
        { objetivo: 'destino', estimadoEn: '2026-09-09T18:30:00Z' },
        '2026-09-09T12:00:00Z',
      ),
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
  ],
  notificaciones: [
    {
      id: 'notif-1',
      severidad: 'critica',
      titulo: 'Desvio de ruta detectado',
      cuerpo: 'La unidad del viaje AI27-000102 salio de la geocerca.',
      ocurrioEn: new Date(Date.now() - 2 * 60_000).toISOString(),
    },
  ],
};

describe('PanelSection · contenido', () => {
  it('presenta los tres indicadores con su valor y su contexto', async () => {
    renderConRouter(<PanelSection panel={panel} />);

    expect(await screen.findByText('24')).toBeInTheDocument();
    expect(screen.getByText('+3 desde ayer')).toBeInTheDocument();
    expect(screen.getByText('Bajo / Normal')).toBeInTheDocument();
    expect(screen.getByText('98% de unidades seguras')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Requieren atención inmediata')).toBeInTheDocument();
  });

  it('sin alertas, el indicador deja de gritar', async () => {
    renderConRouter(<PanelSection panel={{ ...panel, alertasActivas: { total: 0 } }} />);

    expect(await screen.findByText('Sin alertas pendientes')).toBeInTheDocument();
    expect(screen.queryByText('Requieren atención inmediata')).not.toBeInTheDocument();
  });

  it('un nivel de riesgo desconocido se muestra tal cual', async () => {
    renderConRouter(
      <PanelSection
        panel={{ ...panel, riesgoGlobal: { nivel: 'ELEVADO_POR_CLIMA', unidadesSegurasPct: 61 } }}
      />,
    );

    // Sin etiqueta conocida se pinta el codigo: avisa de que falta mapearlo.
    expect(await screen.findByText('ELEVADO_POR_CLIMA')).toBeInTheDocument();
  });

  it('monta las zonas del panel', async () => {
    renderConRouter(<PanelSection panel={panel} />);

    expect(await screen.findByRole('heading', { name: 'Viajes en Curso' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Vista de mapa' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Acciones rapidas' })).toBeInTheDocument();
  });

  it('las notificaciones se presentan como toasts de la libreria, no como tarjeta', async () => {
    renderConRouter(<PanelSection panel={panel} />);

    // El aviso vive ahora en un toast: se muestra su titulo y su cuerpo, y ya NO existe
    // la tarjeta "Notificaciones Recientes" en el layout.
    expect(await screen.findByText('Desvio de ruta detectado')).toBeInTheDocument();
    expect(
      screen.getByText('La unidad del viaje AI27-000102 salio de la geocerca.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Notificaciones Recientes' }),
    ).not.toBeInTheDocument();
  });
});

describe('PanelSection · layout responsive', () => {
  it('los indicadores van de una a dos y a cuatro columnas', async () => {
    const { container } = renderConRouter(<PanelSection panel={panel} />);
    await screen.findByText('24');

    const filaKpis = container.querySelector('.grid');
    expect(filaKpis?.className).toContain('grid-cols-1');
    expect(filaKpis?.className).toContain('md:grid-cols-2');
    expect(filaKpis?.className).toContain('xl:grid-cols-4');
  });

  it('el cuerpo se apila en movil y la tabla ocupa dos tercios en pantalla ancha', async () => {
    const { container } = renderConRouter(<PanelSection panel={panel} />);
    await screen.findByText('24');

    const rejillas = [...container.querySelectorAll('.grid')];
    const cuerpo = rejillas.find((nodo) => nodo.className.includes('xl:grid-cols-3'));

    // Apilado por defecto: una columna hasta xl.
    expect(cuerpo?.className).toContain('grid-cols-1');
    expect(cuerpo?.querySelector('.xl\\:col-span-2')).not.toBeNull();
  });

  it('la tabla precede al mapa en el orden de lectura', async () => {
    renderConRouter(<PanelSection panel={panel} />);

    const tabla = await screen.findByRole('heading', { name: 'Viajes en Curso' });
    const mapa = screen.getByRole('region', { name: 'Vista de mapa' });

    /*
     * El orden del DOM es el orden de lectura en movil. Si alguien recolocara con
     * `order-*`, lo que se ve y lo que se lee dejarian de coincidir y este test lo
     * detecta: DOCUMENT_POSITION_FOLLOWING deja de cumplirse.
     */
    expect(tabla.compareDocumentPosition(mapa)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

describe('disciplina de color · solo roles, nunca escalas crudas', () => {
  /*
   * Escalas de Tailwind y colores literales. `degradado-*` NO esta en la lista: es un
   * rol propio del sistema (ausencia por degradacion del servicio), definido en
   * globals.css y con paridad claro/oscuro, igual que `sidebar`.
   */
  const COLORES_CRUDOS =
    /\b(?:bg|text|border|ring|divide|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|white|black)\b|#[0-9a-fA-F]{3,8}/;

  /*
   * Los fuentes se leen con `import.meta.glob` de Vite y no con `node:fs`: `tests/`
   * se compila con el proyecto de la app, que no tiene tipos de Node — y anadirlos
   * dejaria entrar los globales de Node en el codigo de la app, que es peor.
   *
   * El patron del panel es un comodin, asi que un componente nuevo entra en el
   * barrido sin que nadie lo anada a una lista.
   */
  const fuentesDelPanel = import.meta.glob('../../src/features/panel/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const fuentesRelacionadas = import.meta.glob(
    [
      '../../src/features/viajes/EstadoViajeChip.tsx',
      '../../src/components/ui/Card.tsx',
      '../../src/components/ui/Table.tsx',
      '../../src/components/ui/Button.tsx',
      '../../src/routes/_private/index.tsx',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  const archivos = Object.entries({ ...fuentesDelPanel, ...fuentesRelacionadas });

  it.each(archivos)('%s no contiene colores crudos', (_ruta, contenido) => {
    const coincidencia = COLORES_CRUDOS.exec(contenido);

    // Un color crudo no cambia al anadir `.dark` al <html>: el componente se quedaria
    // en tema claro dentro de una app en oscuro.
    expect(coincidencia?.[0] ?? null).toBeNull();
  });

  it('el barrido cubre todo el directorio del panel', () => {
    // Si el comodin dejara de resolver, el barrido pasaria en verde sin revisar nada.
    expect(Object.keys(fuentesDelPanel).length).toBeGreaterThanOrEqual(6);
  });
});
