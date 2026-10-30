/*
 * NuevaSolicitudForm — alta de servicio del portal (E1-HU-001, E9-T4).
 *
 * Se afirma el COMPORTAMIENTO que exige la HU, no el detalle de implementación:
 *   - El botón de envío está deshabilitado mientras falte origen o destino.
 *   - "Agregar paradas" permite añadir y quitar destinos 1..N.
 *   - Un envío arma la forma de contrato `CrearViajeEntrada` con 1..N destinos.
 *   - Un segundo clic mientras el envío está en vuelo no reenvía (anti-doble-clic).
 *
 * `crearViaje` se sustituye por un doble: aquí se prueba el formulario, no la red.
 *
 * Los campos se consultan por su ROL y nombre accesible (`textbox`/`checkbox`), no por
 * `getByLabelText`: el `FormField` de `@ai27-tech/ui` añade un asterisco de requerido
 * dentro del `<label>` (aria-hidden), así que el nombre accesible es "Origen", pero el
 * texto literal del label es "Origen *". El rol evita esa fragilidad.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OpcionCatalogo, ViajeResumen } from '@/lib/contracts';
import { NuevaSolicitudForm } from '@/features/viajes/NuevaSolicitudForm';
import { renderConRouter } from '../support/router';

const crearViajeMock = vi.fn<(entrada: unknown) => Promise<ViajeResumen>>();
vi.mock('@/lib/api/viajes', () => ({
  crearViaje: (entrada: unknown) => crearViajeMock(entrada),
}));

const TIPOS_SERVICIO: readonly OpcionCatalogo[] = [
  { id: 'monitoreo-activo', nombre: 'Monitoreo Activo' },
];

function viajeCreado(): ViajeResumen {
  return { id: 'viaje-nuevo', estado: 'SOLICITADO' as ViajeResumen['estado'], origen: 'CDMX' };
}

const campo = (nombre: string | RegExp): HTMLInputElement =>
  screen.getByRole('textbox', { name: nombre });
const campoAusente = (nombre: string | RegExp): HTMLElement | null =>
  screen.queryByRole('textbox', { name: nombre });
const botonEnviar = (): HTMLButtonElement =>
  screen.getByRole('button', { name: /Solicitar servicio/ });

/** Monta el form y espera a que el router de memoria lo pinte (render asíncrono). */
async function montar(): Promise<void> {
  renderConRouter(<NuevaSolicitudForm tiposServicio={TIPOS_SERVICIO} />);
  await screen.findByRole('textbox', { name: 'Origen' });
}

beforeEach(() => {
  crearViajeMock.mockReset();
  crearViajeMock.mockResolvedValue(viajeCreado());
});

describe('NuevaSolicitudForm · envío deshabilitado', () => {
  it('deshabilita el envío sin origen ni destino, y lo habilita cuando ambos tienen texto', async () => {
    const user = userEvent.setup();
    await montar();

    expect(botonEnviar()).toBeDisabled();

    await user.type(campo('Origen'), 'CDMX Vallejo');
    // Solo origen: sigue deshabilitado porque falta el destino.
    expect(botonEnviar()).toBeDisabled();

    await user.type(campo('Destino'), 'Laredo, US');
    expect(botonEnviar()).toBeEnabled();
  });

  it('vuelve a deshabilitar el envío si el destino se borra', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Origen'), 'CDMX');
    const destino = campo('Destino');
    await user.type(destino, 'Monterrey');
    expect(botonEnviar()).toBeEnabled();

    await user.clear(destino);
    expect(botonEnviar()).toBeDisabled();
  });

  it('una parada adicional vacía mantiene el envío deshabilitado', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Origen'), 'CDMX');
    await user.click(screen.getByRole('checkbox', { name: 'Agregar paradas' }));
    await user.type(campo('Destino 1'), 'Guadalajara');
    expect(botonEnviar()).toBeEnabled();

    // Añadir una parada extra vacía vuelve a bloquear el envío hasta que tenga texto.
    await user.click(screen.getByRole('button', { name: 'Agregar otra parada' }));
    expect(botonEnviar()).toBeDisabled();

    await user.type(campo('Destino 2'), 'Monterrey');
    expect(botonEnviar()).toBeEnabled();
  });
});

describe('NuevaSolicitudForm · paradas múltiples', () => {
  it('agrega y quita paradas una por una', async () => {
    const user = userEvent.setup();
    await montar();

    // Sin paradas: un solo destino.
    expect(campo('Destino')).toBeInTheDocument();
    expect(campoAusente('Destino 2')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Agregar paradas' }));
    // Ahora el destino principal es "Destino 1".
    expect(campo('Destino 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar otra parada' }));
    expect(campo('Destino 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar otra parada' }));
    expect(campo('Destino 3')).toBeInTheDocument();

    // Quitar la parada 2 deja Destino 1 y un solo destino extra (el que era 3).
    await user.click(screen.getByRole('button', { name: 'Quitar parada 2' }));
    expect(campoAusente('Destino 3')).not.toBeInTheDocument();
    expect(campo('Destino 2')).toBeInTheDocument();
  });

  it('desactivar "Agregar paradas" conserva solo el primer destino', async () => {
    const user = userEvent.setup();
    await montar();

    await user.click(screen.getByRole('checkbox', { name: 'Agregar paradas' }));
    await user.click(screen.getByRole('button', { name: 'Agregar otra parada' }));
    expect(campo('Destino 2')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Agregar paradas' })); // desactiva
    expect(campo('Destino')).toBeInTheDocument();
    expect(campoAusente('Destino 2')).not.toBeInTheDocument();
  });

  it('envía la forma de contrato con origen y los destinos capturados', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Origen'), 'CDMX Vallejo');
    await user.type(campo('Destino'), 'Laredo, US');
    await user.click(screen.getByRole('checkbox', { name: 'Agregar paradas' }));
    await user.click(screen.getByRole('button', { name: 'Agregar otra parada' }));
    await user.type(campo('Destino 2'), 'Nuevo Laredo');

    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    expect(crearViajeMock).toHaveBeenCalledWith({
      origen: 'CDMX Vallejo',
      destinos: [{ nombre: 'Laredo, US' }, { nombre: 'Nuevo Laredo' }],
    });
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument();
  });
});

describe('NuevaSolicitudForm · anti-doble-clic', () => {
  it('no reenvía con un segundo clic mientras el envío está en vuelo', async () => {
    const user = userEvent.setup();
    // Creación que no resuelve hasta que la liberamos: mantiene el estado "pending".
    let liberar: (v: ViajeResumen) => void = () => {};
    crearViajeMock.mockImplementation(
      () =>
        new Promise<ViajeResumen>((resolve) => {
          liberar = resolve;
        }),
    );

    await montar();
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino'), 'Monterrey');

    const boton = botonEnviar();
    await user.click(boton);
    // Mientras está en vuelo, el botón queda deshabilitado (loading) y no reenvía.
    expect(boton).toBeDisabled();
    await user.click(boton);

    expect(crearViajeMock).toHaveBeenCalledTimes(1);

    liberar(viajeCreado());
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument();
  });
});
