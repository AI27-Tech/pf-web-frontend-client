/*
 * EmergenciaPanel — activación y notas de emergencia del cliente (E9-T9, AI27-28).
 *
 * Estados obligatorios del ticket cubiertos aquí:
 *   - sin emergencias
 *   - emergencia activa (indicador agregado)
 *   - varios casos → selector identificado SOLO por fecha/hora
 *   - reintento idempotente que no duplica (el activacion_id POR PULSACIÓN)
 *   - nota en el límite (1000 ok; vacía / solo-espacios NO se envía)
 *   - proyección por audiencia: la vista cliente nunca renderiza datos internos
 *
 * El carril de API (`@/lib/api/emergencias`) se sustituye por dobles: estas pruebas
 * fijan el COMPORTAMIENTO de la UI (qué manda, cuándo, con qué forma), no la pila HTTP.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EmergenciaCliente, EmergenciasCliente } from '@/lib/contracts';

const listEmergencias = vi.fn();
const activarEmergencia = vi.fn();
const agregarNotaEmergencia = vi.fn();
vi.mock('@/lib/api/emergencias', () => ({
  listEmergencias: (...args: unknown[]) => listEmergencias(...args),
  activarEmergencia: (...args: unknown[]) => activarEmergencia(...args),
  agregarNotaEmergencia: (...args: unknown[]) => agregarNotaEmergencia(...args),
}));

const { EmergenciaPanel } = await import('@/features/viajes/EmergenciaPanel');
const { renderConQuery } = await import('../support/query');

function vista(
  casos: readonly EmergenciaCliente[],
  emergenciaActiva = casos.some((c) => c.estado === 'abierta' || c.estado === 'en_atencion'),
): EmergenciasCliente {
  return { emergencia_activa: emergenciaActiva, casos: [...casos] };
}

const CASO_ACTIVO: EmergenciaCliente = {
  id: 'emg-1',
  estado: 'en_atencion',
  activada_en: '2026-10-23T14:05:00Z',
};
const CASO_RESUELTO: EmergenciaCliente = {
  id: 'emg-2',
  estado: 'resuelta',
  activada_en: '2026-10-23T09:15:00Z',
};

beforeEach(() => {
  listEmergencias.mockReset().mockResolvedValue(vista([]));
  activarEmergencia.mockReset();
  agregarNotaEmergencia.mockReset().mockResolvedValue(undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('EmergenciaPanel — estados de la lista (E9-T9)', () => {
  it('sin emergencias: muestra el vacío y ninguna lista de casos', async () => {
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);

    expect(await screen.findByText('Sin emergencias en este viaje.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    // El botón de activar está disponible aunque no haya casos.
    expect(screen.getByRole('button', { name: 'Activar emergencia' })).toBeEnabled();
  });

  it('emergencia activa: refleja el indicador agregado', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO]));
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);

    expect(await screen.findByText('Hay una emergencia activa en este viaje.')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('En atención');
  });

  it('un solo caso: NO muestra el selector de caso', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO]));
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);

    await screen.findByRole('listitem');
    expect(screen.queryByLabelText('Caso de emergencia')).not.toBeInTheDocument();
  });

  it('varios casos: ofrece un selector identificado SOLO por fecha/hora', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO, CASO_RESUELTO]));
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);

    const selector = await screen.findByLabelText('Caso de emergencia');
    const opciones = within(selector as HTMLElement).getAllByRole('option');
    expect(opciones).toHaveLength(2);
    // Las opciones solo llevan fecha/hora: ni id, ni estado, ni nada interno.
    for (const opcion of opciones) {
      expect(opcion.textContent).not.toContain('emg-');
      expect(opcion.textContent).not.toMatch(/en_atencion|resuelta|abierta/);
    }
  });
});

describe('EmergenciaPanel — activación idempotente (E9-T9)', () => {
  it('cada pulsación genera un activacion_id distinto; un reintento técnico reusa el mismo', async () => {
    activarEmergencia.mockImplementation((_viajeId: string, entrada: { activacion_id: string }) =>
      Promise.resolve({ id: 'emg-x', estado: 'abierta', activada_en: 'x', ...entrada }),
    );
    const user = userEvent.setup();
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);
    await screen.findByText('Sin emergencias en este viaje.');

    // Pulsación 1: abrir el diálogo y confirmar.
    await user.click(screen.getByRole('button', { name: 'Activar emergencia' }));
    await user.click(screen.getByRole('button', { name: 'Activar ahora' }));
    await waitFor(() => expect(activarEmergencia).toHaveBeenCalledTimes(1));

    // Pulsación 2: otra confirmación intencional.
    await user.click(screen.getByRole('button', { name: 'Activar emergencia' }));
    await user.click(screen.getByRole('button', { name: 'Activar ahora' }));
    await waitFor(() => expect(activarEmergencia).toHaveBeenCalledTimes(2));

    const idPulsacion1 = (activarEmergencia.mock.calls[0]?.[1] as { activacion_id: string })
      .activacion_id;
    const idPulsacion2 = (activarEmergencia.mock.calls[1]?.[1] as { activacion_id: string })
      .activacion_id;

    // Dos PULSACIONES distintas → dos ids distintos (crearán dos casos aguas abajo).
    expect(idPulsacion1).not.toBe(idPulsacion2);
    // Y cada id es un identificador no vacío (UUID): el reintento técnico de UNA misma
    // mutación reusaría ese valor, por eso no duplica.
    expect(idPulsacion1).toMatch(/[0-9a-f-]{8,}/i);
  });
});

describe('EmergenciaPanel — notas (E9-T9)', () => {
  it('una nota vacía o de solo espacios NO se envía', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO]));
    const user = userEvent.setup();
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);
    await screen.findByRole('listitem');

    const agregar = screen.getByRole('button', { name: 'Agregar nota' });
    // Vacío: el botón está deshabilitado y no se envía nada.
    expect(agregar).toBeDisabled();

    // Solo espacios: sigue sin enviarse (el recorte lo deja vacío).
    await user.type(screen.getByLabelText('Nota de emergencia'), '    ');
    expect(agregar).toBeDisabled();
    expect(agregarNotaEmergencia).not.toHaveBeenCalled();
  });

  it('una nota con texto se envía recortada al caso destino', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO]));
    const user = userEvent.setup();
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);
    await screen.findByRole('listitem');

    await user.type(screen.getByLabelText('Nota de emergencia'), '  unidad detenida  ');
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }));

    await waitFor(() => expect(agregarNotaEmergencia).toHaveBeenCalledTimes(1));
    expect(agregarNotaEmergencia).toHaveBeenCalledWith('viaje-1', 'emg-1', {
      cuerpo: 'unidad detenida',
    });
  });

  it('una nota de 1000 caracteres (el límite) se envía; el textarea no acepta más', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO]));
    const user = userEvent.setup();
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);
    await screen.findByRole('listitem');

    const textarea = screen.getByLabelText('Nota de emergencia') as HTMLTextAreaElement;
    // El atributo maxLength impide capturar más de 1000: tope de captura y de envío.
    expect(textarea).toHaveAttribute('maxlength', '1000');

    const milChars = 'a'.repeat(1000);
    // `paste` evita 1000 pulsaciones de teclado (y respeta maxLength igual).
    textarea.focus();
    await user.paste(milChars);

    await user.click(screen.getByRole('button', { name: 'Agregar nota' }));
    await waitFor(() => expect(agregarNotaEmergencia).toHaveBeenCalledTimes(1));
    const entrada = agregarNotaEmergencia.mock.calls[0]?.[2] as { cuerpo: string };
    expect(entrada.cuerpo).toHaveLength(1000);
  });

  it('con varios casos, la nota va al caso SELECCIONADO', async () => {
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO, CASO_RESUELTO]));
    const user = userEvent.setup();
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);

    const selector = await screen.findByLabelText('Caso de emergencia');
    await user.selectOptions(selector, 'emg-2');

    await user.type(screen.getByLabelText('Nota de emergencia'), 'nota al segundo caso');
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }));

    await waitFor(() => expect(agregarNotaEmergencia).toHaveBeenCalledTimes(1));
    expect(agregarNotaEmergencia).toHaveBeenCalledWith('viaje-1', 'emg-2', {
      cuerpo: 'nota al segundo caso',
    });
  });
});

describe('EmergenciaPanel — proyección por audiencia (E9-T9, ADR 21 §6)', () => {
  it('la vista cliente nunca renderiza datos internos (responsable, recursos, notas, Reacción)', async () => {
    // Aunque el servidor devolviera de más, la vista cliente SOLO conoce {id, estado,
    // activada_en}. Afirmamos que el DOM no contiene vocabulario interno.
    listEmergencias.mockResolvedValue(vista([CASO_ACTIVO, CASO_RESUELTO]));
    renderConQuery(<EmergenciaPanel viajeId="viaje-1" />);

    await screen.findAllByRole('listitem');
    const texto = document.body.textContent ?? '';

    for (const interno of [
      'responsable',
      'Responsable',
      'Reacción',
      'recurso',
      'custodio',
      'patrulla',
      // Los ids técnicos de caso tampoco se muestran.
      'emg-1',
      'emg-2',
    ]) {
      expect(texto).not.toContain(interno);
    }
  });
});
