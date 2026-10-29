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
import type { IncidenciaCurada, ViajeSeguimiento } from '@/lib/contracts';
import { ViajeDetailSection } from '@/features/viajes/ViajeDetailSection';
import { renderConQuery as render } from '../support/query';

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
  it('sin incidencias: muestra el estado vacío y ninguna entrada', () => {
    render(<ViajeDetailSection viaje={seguimiento([])} />);

    expect(screen.getByText('Sin incidencias reportadas.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('una incidencia en atención: muestra categoría, estado "En atención" y fecha', () => {
    render(
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

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(CATEGORIAS_CURADAS.seguridad);
    expect(items[0]).toHaveTextContent('En atención');
    expect(items[0]).not.toHaveTextContent('Resuelta');
  });

  it('una incidencia resuelta: traduce el estado a "Resuelta"', () => {
    render(
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

    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent(CATEGORIAS_CURADAS.falla);
    expect(item).toHaveTextContent('Resuelta');
    expect(item).not.toHaveTextContent('En atención');
  });

  it('varias incidencias: renderiza una entrada por cada una, en orden', () => {
    render(
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

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(CATEGORIAS_CURADAS.seguridad);
    expect(items[1]).toHaveTextContent(CATEGORIAS_CURADAS.retraso);
    expect(items[2]).toHaveTextContent(CATEGORIAS_CURADAS.perdidaContacto);
  });

  it('incidencia con impacto en el ETA: muestra el impacto cuando el contrato lo trae', () => {
    render(
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

    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Impacto en el ETA: +45 min');
  });

  it('impacto_eta null o ausente: no pinta la línea de impacto ni texto de relleno', () => {
    render(
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

  it('invariante de seguridad (DEC-006): nunca filtra el tipo técnico interno', () => {
    // Un seguimiento con incidencias de las cinco categorías curadas. Pase lo que pase,
    // el DOM no debe contener ningún nombre técnico del catálogo interno.
    render(
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

    const lista = screen.getByRole('list');
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
  it('ETA presente y al día: muestra la fecha sin la marca de obsolescencia', () => {
    render(
      <ViajeDetailSection
        viaje={seguimientoConEta({ valor: '2026-10-23T18:00:00Z', obsoleto: false })}
      />,
    );

    const grupo = screen.getByText('ETA estimado').closest('div') as HTMLElement;
    expect(within(grupo).queryByText('(obsoleto)')).not.toBeInTheDocument();
    expect(within(grupo).queryByText('Sin ETA')).not.toBeInTheDocument();
  });

  it('ETA presente pero obsoleto: conserva la fecha y añade la marca "(obsoleto)"', () => {
    render(
      <ViajeDetailSection
        viaje={seguimientoConEta({ valor: '2026-10-23T18:00:00Z', obsoleto: true })}
      />,
    );

    const grupo = screen.getByText('ETA estimado').closest('div') as HTMLElement;
    // No se oculta el dato viejo: se etiqueta. Esa es la invariante de ADR 20/27.
    expect(within(grupo).getByText('(obsoleto)')).toBeInTheDocument();
    expect(within(grupo).queryByText('Sin ETA')).not.toBeInTheDocument();
  });

  it('ETA ausente (null): muestra "Sin ETA" y no inventa marca ni posición', () => {
    render(<ViajeDetailSection viaje={seguimientoConEta(null)} />);

    const grupo = screen.getByText('ETA estimado').closest('div') as HTMLElement;
    expect(within(grupo).getByText('Sin ETA')).toBeInTheDocument();
    expect(within(grupo).queryByText('(obsoleto)')).not.toBeInTheDocument();
  });
});
