/*
 * ViajeDetailSection: la vista CURADA de incidencias del viaje para el cliente (E9-T6,
 * AI27-93).
 *
 * Qué se prueba aquí:
 *   - Los cinco estados obligatorios del ticket: sin incidencias; una en atención; una
 *     resuelta; varias; una con impacto en el ETA.
 *   - La INVARIANTE DE SEGURIDAD (DEC-006): dado un seguimiento con incidencias, el DOM
 *     nunca contiene un nombre técnico interno del catálogo (p. ej. "Asalto o Robo"). El
 *     cliente solo ve las cinco categorías curadas. El mapeo tipo interno → categoría
 *     vive en el bff (internal/tracking/incidencias.go), nunca en el portal.
 *
 * Los fixtures tienen forma de contrato: `ViajeSeguimiento` / `IncidenciaCurada` del
 * barrel @/lib/contracts, que reexporta los tipos generados del contrato bff. No se
 * fabrica una forma propia del portal.
 */

import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IncidenciaCurada, ViajeSeguimiento } from '@/lib/contracts';
import { listEmergencias } from '@/lib/api/emergencias';
import { ViajeDetailSection } from '@/features/viajes/ViajeDetailSection';
import { renderConRouter } from '../support/router';
import { ConRanuraPanelLateral } from '../support/panelLateral';

async function render(ui: React.ReactElement): Promise<void> {
  renderConRouter(ui);
  await screen.findByRole('heading', { level: 1 });
}

/** La tarjeta de incidencias: el recorrido también es una lista, así que se acota. */
function tarjetaIncidencias(): HTMLElement {
  return screen
    .getByRole('heading', { name: 'Incidencias' })
    .closest('[data-variant]') as HTMLElement;
}

/*
 * El detalle ahora monta `EmergenciaPanel` (E9-T9), que pide sus casos al `bff`. Estas
 * pruebas son sobre incidencias/ETA, no sobre emergencia.
 */
vi.mock('@/lib/api/emergencias', () => ({
  listEmergencias: vi.fn().mockResolvedValue({ emergencia_activa: false, casos: [] }),
  activarEmergencia: vi.fn(),
  agregarNotaEmergencia: vi.fn(),
}));

/**
 * Las cinco categorías CURADAS que el cliente puede ver (DEC-006). Es la tabla cerrada
 * que el bff produce; el portal solo las muestra.
 */
const CATEGORIAS_CURADAS = {
  seguridad: 'Incidencia de seguridad',
  accidente: 'Accidente/percance',
  falla: 'Falla mecánica/de equipo',
  retraso: 'Retraso/desvío en ruta',
  perdidaContacto: 'Pérdida de contacto',
} as const;

/**
 * Nombres TÉCNICOS internos del catálogo de estatus operativos. El cliente NO debe
 * verlos jamás: son justo los términos que el mapeo del bff traduce a categoría. Si
 * alguno aparece en el DOM, el portal filtró el tipo interno y DEC-006 se rompió.
 */
const NOMBRES_TECNICOS_INTERNOS = [
  'Asalto o Robo',
  'Intercepción de custodia',
  'Abandono de custodia',
  'Sabotaje GPS',
  'Retiro de GPS',
  'Rompimiento de Convoy',
  'Accidente Del Transporte Por Volcadura',
  'Percance Automovilístico',
  'Falla Mecánica',
  'Bloqueo Carretero',
  'Desvió de Ruta',
  'Custodia no responde al teléfono',
];

/** Construye un ViajeSeguimiento con la forma del contrato y las incidencias dadas. */
function seguimiento(incidencias: readonly IncidenciaCurada[]): ViajeSeguimiento {
  return {
    id: 'viaje-1',
    hito: { estado: 'EN_TRANSITO', etiqueta: 'En tránsito' },
    eta: { valor: '2026-10-23T18:00:00Z', obsoleto: false },
    incidencias: [...incidencias],
  };
}

/** Igual que `seguimiento`, pero deja fijar la forma del ETA (presente/obsoleto/ausente). */
function seguimientoConEta(eta: NonNullable<ViajeSeguimiento['eta']> | null): ViajeSeguimiento {
  return {
    id: 'viaje-1',
    hito: { estado: 'EN_TRANSITO', etiqueta: 'En tránsito' },
    eta,
    incidencias: [],
  };
}

describe('ViajeDetailSection — incidencias curadas (E9-T6)', () => {
  it('sin incidencias: muestra el estado vacío y ninguna entrada', async () => {
    await render(<ViajeDetailSection viaje={seguimiento([])} />);

    expect(screen.getByText('Sin incidencias reportadas.')).toBeInTheDocument();
    expect(within(tarjetaIncidencias()).queryByRole('list')).not.toBeInTheDocument();
  });

  it('una incidencia en atención: muestra categoría, estado "En atención" y fecha', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimiento([
          {
            categoria: CATEGORIAS_CURADAS.seguridad,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T15:30:00Z',
          },
        ])}
      />,
    );

    const items = within(tarjetaIncidencias()).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(CATEGORIAS_CURADAS.seguridad);
    expect(items[0]).toHaveTextContent('En atención');
    expect(items[0]).not.toHaveTextContent('Resuelta');
  });

  it('una incidencia resuelta: traduce el estado a "Resuelta"', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimiento([
          {
            categoria: CATEGORIAS_CURADAS.falla,
            estado: 'resuelta',
            marca_tiempo: '2026-10-23T16:00:00Z',
          },
        ])}
      />,
    );

    const item = within(tarjetaIncidencias()).getByRole('listitem');
    expect(item).toHaveTextContent(CATEGORIAS_CURADAS.falla);
    expect(item).toHaveTextContent('Resuelta');
    expect(item).not.toHaveTextContent('En atención');
  });

  it('varias incidencias: renderiza una entrada por cada una, en orden', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimiento([
          {
            categoria: CATEGORIAS_CURADAS.seguridad,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T15:30:00Z',
          },
          {
            categoria: CATEGORIAS_CURADAS.retraso,
            estado: 'resuelta',
            marca_tiempo: '2026-10-23T16:45:00Z',
          },
          {
            categoria: CATEGORIAS_CURADAS.perdidaContacto,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T17:10:00Z',
          },
        ])}
      />,
    );

    const items = within(tarjetaIncidencias()).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(CATEGORIAS_CURADAS.seguridad);
    expect(items[1]).toHaveTextContent(CATEGORIAS_CURADAS.retraso);
    expect(items[2]).toHaveTextContent(CATEGORIAS_CURADAS.perdidaContacto);
  });

  it('incidencia con impacto en el ETA: muestra el impacto cuando el contrato lo trae', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimiento([
          {
            categoria: CATEGORIAS_CURADAS.retraso,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T15:30:00Z',
            impacto_eta: '+45 min',
          },
        ])}
      />,
    );

    const item = within(tarjetaIncidencias()).getByRole('listitem');
    expect(item).toHaveTextContent('Impacto en el ETA: +45 min');
  });

  it('impacto_eta null o ausente: no pinta la línea de impacto ni texto de relleno', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimiento([
          {
            categoria: CATEGORIAS_CURADAS.seguridad,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T15:30:00Z',
            impacto_eta: null,
          },
          {
            categoria: CATEGORIAS_CURADAS.falla,
            estado: 'resuelta',
            marca_tiempo: '2026-10-23T16:00:00Z',
          },
        ])}
      />,
    );

    expect(screen.queryByText(/Impacto en el ETA/i)).not.toBeInTheDocument();
  });

  it('invariante de seguridad (DEC-006): nunca filtra el tipo técnico interno', async () => {
    // Un seguimiento con incidencias de las cinco categorías curadas. Pase lo que pase,
    // el DOM no debe contener ningún nombre técnico del catálogo interno.
    await render(
      <ViajeDetailSection
        viaje={seguimiento([
          {
            categoria: CATEGORIAS_CURADAS.seguridad,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T15:30:00Z',
            impacto_eta: '+30 min',
          },
          {
            categoria: CATEGORIAS_CURADAS.accidente,
            estado: 'resuelta',
            marca_tiempo: '2026-10-23T16:00:00Z',
          },
          {
            categoria: CATEGORIAS_CURADAS.falla,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T16:30:00Z',
          },
          {
            categoria: CATEGORIAS_CURADAS.retraso,
            estado: 'resuelta',
            marca_tiempo: '2026-10-23T17:00:00Z',
          },
          {
            categoria: CATEGORIAS_CURADAS.perdidaContacto,
            estado: 'en_atencion',
            marca_tiempo: '2026-10-23T17:30:00Z',
          },
        ])}
      />,
    );

    const lista = within(tarjetaIncidencias()).getByRole('list');
    const textoVisible = lista.textContent ?? '';

    for (const tecnico of NOMBRES_TECNICOS_INTERNOS) {
      expect(textoVisible).not.toContain(tecnico);
    }

    // Y lo que sí aparece son las cinco categorías curadas.
    for (const categoria of Object.values(CATEGORIAS_CURADAS)) {
      expect(
        within(lista).getByText(new RegExp(categoria.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))),
      ).toBeInTheDocument();
    }
  });
});

/*
 * Frescura del ETA estimado (E9-T5, AI27-24).
 *
 * El seguimiento V1 muestra el ETA como ESTIMADO, no en vivo (ADR 20/27): lo fija el
 * monitorista a mano. Su frescura viaja en el propio contrato —`eta.obsoleto`— y la
 * vista la refleja en tres variantes: presente al día, presente pero obsoleto (se
 * marca, no se oculta), y ausente (sin ETA). El polling de E9-T5 solo cambia cada
 * cuánto llega este dato; la forma de pintarlo es la que se fija aquí.
 */
describe('ViajeDetailSection — frescura del ETA (E9-T5)', () => {
  it('ETA presente y al día: muestra la fecha sin la marca de obsolescencia', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimientoConEta({ valor: '2026-10-23T18:00:00Z', obsoleto: false })}
      />,
    );

    const grupo = screen.getByText('ETA estimado').closest('div') as HTMLElement;
    expect(within(grupo).queryByText('Obsoleto')).not.toBeInTheDocument();
    expect(within(grupo).queryByText('Sin ETA')).not.toBeInTheDocument();
  });

  it('ETA presente pero obsoleto: conserva la fecha y añade la marca "Obsoleto"', async () => {
    await render(
      <ViajeDetailSection
        viaje={seguimientoConEta({ valor: '2026-10-23T18:00:00Z', obsoleto: true })}
      />,
    );

    const grupo = screen.getByText('ETA estimado').closest('div') as HTMLElement;
    // No se oculta el dato viejo: se etiqueta. Esa es la invariante de ADR 20/27.
    expect(within(grupo).getByText('Obsoleto')).toBeInTheDocument();
    expect(within(grupo).queryByText('Sin ETA')).not.toBeInTheDocument();
  });

  it('ETA ausente (null): muestra "Sin ETA" y no inventa marca ni posición', async () => {
    await render(<ViajeDetailSection viaje={seguimientoConEta(null)} />);

    const grupo = screen.getByText('ETA estimado').closest('div') as HTMLElement;
    expect(within(grupo).getByText('Sin ETA')).toBeInTheDocument();
    expect(within(grupo).queryByText('Obsoleto')).not.toBeInTheDocument();
  });
});

/*
 * Estructura del seguimiento: recorrido en cuatro pasos, tarjetas de hito y ETA, aviso de
 * emergencia activa.
 */
function seguimientoEnEstado(estado: string): ViajeSeguimiento {
  return {
    id: 'viaje-1',
    hito: { estado, etiqueta: 'Hito de prueba' },
    eta: null,
    incidencias: [],
  };
}

describe('ViajeDetailSection — recorrido del viaje', () => {
  const recorrido = (): HTMLElement => screen.getByRole('list', { name: 'Progreso del viaje' });

  it('pinta los cuatro pasos y marca el actual con aria-current', async () => {
    await render(<ViajeDetailSection viaje={seguimientoEnEstado('EN_TRANSITO')} />);
    const pasos = within(recorrido()).getAllByRole('listitem');
    expect(pasos).toHaveLength(4);
    ['Solicitado', 'Confirmado', 'En tránsito', 'Entregado'].forEach((nombre, i) =>
      expect(pasos[i]).toHaveTextContent(nombre),
    );
    const actual = recorrido().querySelector('[aria-current="step"]');
    expect(actual).toHaveTextContent('En tránsito');
    expect(actual).toHaveTextContent('En curso');
    expect(pasos[0]).toHaveTextContent('Completado');
    expect(pasos[3]).toHaveTextContent('Pendiente');
  });

  it('un viaje cancelado no pinta el recorrido', async () => {
    await render(<ViajeDetailSection viaje={seguimientoEnEstado('CANCELADO')} />);
    expect(screen.queryByRole('list', { name: 'Progreso del viaje' })).not.toBeInTheDocument();
  });

  it('un viaje cerrado muestra todos los pasos completados y ninguno en curso', async () => {
    await render(<ViajeDetailSection viaje={seguimientoEnEstado('CERRADO')} />);
    expect(recorrido().querySelector('[aria-current="step"]')).toBeNull();
    expect(within(recorrido()).getAllByText('Completado')).toHaveLength(4);
  });
});

describe('ViajeDetailSection — hito y ETA', () => {
  it('muestra el hito actual con su etiqueta', async () => {
    await render(<ViajeDetailSection viaje={seguimientoEnEstado('SOLICITADO')} />);

    expect(screen.getByText('Hito actual')).toBeInTheDocument();
    expect(screen.getByText('Hito de prueba')).toBeInTheDocument();
  });

  it('sin etiqueta de hito no inventa la tarjeta', async () => {
    const viaje: ViajeSeguimiento = {
      id: 'viaje-1',
      hito: { estado: 'SOLICITADO' },
      eta: null,
      incidencias: [],
    };
    await render(<ViajeDetailSection viaje={viaje} />);

    expect(screen.queryByText('Hito actual')).not.toBeInTheDocument();
  });
});

describe('ViajeDetailSection — aviso de emergencia activa', () => {
  it('sin emergencia activa no hay aviso', async () => {
    await render(<ViajeDetailSection viaje={seguimientoEnEstado('EN_TRANSITO')} />);

    // Espera a que la consulta de emergencias resuelva antes de afirmar la ausencia.
    await screen.findByText('Sin emergencias en este viaje.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('con emergencia activa muestra el aviso, sin botón "Ver casos"', async () => {
    vi.mocked(listEmergencias).mockResolvedValueOnce({
      emergencia_activa: true,
      casos: [{ id: 'e-1', activada_en: '2026-10-23T14:05:00Z', estado: 'en_atencion' }],
    });
    await render(<ViajeDetailSection viaje={seguimientoEnEstado('EN_TRANSITO')} />);

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('Hay una emergencia activa en este viaje.');
    // El aviso es solo informativo: ya no ofrece un botón que lleve a los casos.
    expect(within(aviso).queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ViajeDetailSection — activación de emergencia según el hito', () => {
  it.each(['EN_TRANSITO', 'EN_DESTINO', 'EN_DESCARGA'])(
    '%s ofrece "Activar emergencia"',
    async (estado) => {
      await render(<ViajeDetailSection viaje={seguimientoEnEstado(estado)} />);
      expect(await screen.findByRole('button', { name: 'Activar emergencia' })).toBeInTheDocument();
    },
  );

  it.each(['ASIGNADO', 'EN_EMBARQUE'])('%s no la ofrece', async (estado) => {
    await render(<ViajeDetailSection viaje={seguimientoEnEstado(estado)} />);
    await screen.findByText('Sin emergencias en este viaje.');
    expect(screen.queryByRole('button', { name: 'Activar emergencia' })).not.toBeInTheDocument();
  });
});

describe('ViajeDetailSection — ruta de navegación', () => {
  it('el breadcrumb vuelve al historial conservando el filtro y marca el viaje actual', async () => {
    await render(
      <ViajeDetailSection viaje={seguimientoEnEstado('EN_TRANSITO')} estadoHistorial="CERRADO" />,
    );
    const ruta = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(ruta).getByRole('link', { name: 'Historial de Viajes' })).toHaveAttribute(
      'href',
      '/viajes?estado=CERRADO',
    );
    expect(within(ruta).getByText('Viaje viaje-1').closest('[aria-current="page"]')).not.toBeNull();
  });
});

describe('ViajeDetailSection — panel lateral de la conversación (expandido y contraído)', () => {
  const panel = (): HTMLElement => screen.getByRole('complementary', { name: 'Conversación' });
  const rejilla = (): HTMLElement | null =>
    screen.getByRole('region', { name: 'Seguimiento' }).parentElement;

  async function renderConPanel(conversacion?: React.ReactNode): Promise<void> {
    await render(
      <ConRanuraPanelLateral>
        <ViajeDetailSection
          viaje={seguimientoEnEstado('EN_TRANSITO')}
          {...(conversacion !== undefined ? { conversacion } : {})}
        />
      </ConRanuraPanelLateral>,
    );
  }

  it('sin conversación no hay panel ni botones', async () => {
    await renderConPanel();

    expect(screen.getByRole('region', { name: 'Seguimiento' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Acciones' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Conversación' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /conversación/i })).not.toBeInTheDocument();
  });

  it('con conversación, el panel arranca EXPANDIDO y vive fuera de la rejilla del detalle', async () => {
    await renderConPanel(<p>contenido de la conversación</p>);

    expect(within(panel()).getByText('contenido de la conversación')).toBeInTheDocument();
    expect(panel()).not.toHaveAttribute('data-collapsed');
    expect(within(panel()).getByRole('heading', { name: 'Conversación' })).toBeInTheDocument();
    // No es una columna de la rejilla: se pinta en la ranura del shell, a un lado de <main>.
    expect(rejilla()).not.toContainElement(panel());
    expect(screen.getByRole('main')).not.toContainElement(panel());
  });

  it('el encabezado de la página ya no trae botón de ocultar o mostrar la conversación', async () => {
    await renderConPanel(<p>conversación</p>);

    expect(screen.queryByRole('button', { name: /ocultar|mostrar/i })).not.toBeInTheDocument();
    // El único control está en el propio panel.
    expect(within(panel()).getByRole('button', { name: 'Contraer conversación' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('contraer deja una franja con el icono de mensaje y quita el contenido', async () => {
    const user = userEvent.setup();
    await renderConPanel(<p>contenido de la conversación</p>);

    await user.click(screen.getByRole('button', { name: 'Contraer conversación' }));

    // La franja sigue ahí (columna fija), pero sin título ni contenido.
    expect(panel()).toHaveAttribute('data-collapsed', 'true');
    expect(screen.queryByText('contenido de la conversación')).not.toBeInTheDocument();
    expect(within(panel()).queryByRole('heading')).not.toBeInTheDocument();
    const expandir = within(panel()).getByRole('button', { name: 'Expandir conversación' });
    expect(expandir).toHaveAttribute('aria-expanded', 'false');
    expect(expandir).toHaveAttribute('aria-controls', panel().id);
    expect(expandir.querySelector('svg')).not.toBeNull();
  });

  it('expandir desde la franja regresa el contenido', async () => {
    const user = userEvent.setup();
    await renderConPanel(<p>contenido de la conversación</p>);

    await user.click(screen.getByRole('button', { name: 'Contraer conversación' }));
    await user.click(screen.getByRole('button', { name: 'Expandir conversación' }));

    expect(panel()).not.toHaveAttribute('data-collapsed');
    expect(within(panel()).getByText('contenido de la conversación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contraer conversación' })).toBeInTheDocument();
  });

  it('contraer el panel no toca Seguimiento ni Acciones', async () => {
    const user = userEvent.setup();
    await renderConPanel(<p>conversación</p>);

    await user.click(screen.getByRole('button', { name: 'Contraer conversación' }));

    expect(screen.getByRole('region', { name: 'Seguimiento' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Acciones' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Activar emergencia' })).toBeInTheDocument();
  });
});
