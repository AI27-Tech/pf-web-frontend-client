/*
 * NuevaSolicitudForm — alta de servicio del portal (E1-HU-001, E9-T4).
 *
 * Se afirma el COMPORTAMIENTO que exige la HU, no el detalle de implementación:
 *   - El botón de envío está deshabilitado mientras falte origen o destino.
 *   - El interruptor "Seguimiento con múltiples destinos" permite añadir y quitar destinos 1..N; solo ellos se
 *     numeran, y el último punto de la ruta es el "Destino final".
 *   - Los destinos se reordenan con el teclado (flechas) y arrastrando; se renumeran.
 *   - Tipo de escolta (Patrulla o Moto) y sobreescolta opcional: hoy no viajan en el envío
 *     porque `CrearViajeEntrada` no los modela.
 *   - Un envío arma la forma de contrato `CrearViajeEntrada`: los destinos en orden y el
 *     destino final al último.
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
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ViajeResumen } from '@/lib/contracts';
import { NuevaSolicitudForm } from '@/features/viajes/NuevaSolicitudForm';
import { renderConRouter } from '../support/router';

const crearViajeMock = vi.fn<(entrada: unknown) => Promise<ViajeResumen>>();
vi.mock('@/lib/api/viajes', () => ({
  crearViaje: (entrada: unknown) => crearViajeMock(entrada),
}));

function viajeCreado(): ViajeResumen {
  return { id: 'viaje-nuevo', estado: 'SOLICITADO' as ViajeResumen['estado'], origen: 'CDMX' };
}

const campo = (nombre: string | RegExp): HTMLInputElement =>
  screen.getByRole('textbox', { name: nombre });
const campoAusente = (nombre: string | RegExp): HTMLElement | null =>
  screen.queryByRole('textbox', { name: nombre });
const botonEnviar = (): HTMLButtonElement =>
  screen.getByRole('button', { name: /Solicitar servicio/ });

type Usuario = ReturnType<typeof userEvent.setup>;

/** Fecha y hora válidas que usan las pruebas, y el instante UTC que debe viajar. */
const FECHA = '2026-11-20';
const HORA = '09:30';
const FECHA_HORA_UTC = new Date(2026, 10, 20, 9, 30, 0, 0).toISOString();

/** Abre el select del grupo y elige la opción por su etiqueta. */
async function elegirOpcion(user: Usuario, nombreGrupo: string, opcion: string): Promise<void> {
  const dentro = within(screen.getByRole('group', { name: nombreGrupo }));
  await user.click(dentro.getByRole('button'));
  await user.click(dentro.getByRole('button', { name: opcion }));
}

/** Completa los obligatorios que no son la ruta: tipo de escolta, fecha y hora. */
async function completarObligatorios(user: Usuario): Promise<void> {
  await elegirOpcion(user, 'Tipo de escolta', 'Patrulla');
  fireEvent.change(screen.getByLabelText(/Fecha del servicio/), { target: { value: FECHA } });
  fireEvent.change(screen.getByLabelText(/Hora del servicio/), { target: { value: HORA } });
}

/** Monta el form y espera a que el router de memoria lo pinte (render asíncrono). */
async function montar(): Promise<void> {
  renderConRouter(<NuevaSolicitudForm />);
  await screen.findByRole('textbox', { name: 'Origen' });
}

beforeEach(() => {
  crearViajeMock.mockReset();
  crearViajeMock.mockResolvedValue(viajeCreado());
});

describe('NuevaSolicitudForm · envío deshabilitado', () => {
  it('deshabilita el envío mientras falte cualquier obligatorio y lo habilita con todos', async () => {
    const user = userEvent.setup();
    await montar();

    expect(botonEnviar()).toBeDisabled();

    await user.type(campo('Origen'), 'CDMX Vallejo');
    expect(botonEnviar()).toBeDisabled(); // falta el destino final

    await user.type(campo('Destino final'), 'Laredo, US');
    expect(botonEnviar()).toBeDisabled(); // falta el tipo de escolta

    await elegirOpcion(user, 'Tipo de escolta', 'Patrulla');
    expect(botonEnviar()).toBeDisabled(); // faltan fecha y hora

    fireEvent.change(screen.getByLabelText(/Fecha del servicio/), { target: { value: FECHA } });
    expect(botonEnviar()).toBeDisabled(); // falta la hora

    fireEvent.change(screen.getByLabelText(/Hora del servicio/), { target: { value: HORA } });
    expect(botonEnviar()).toBeEnabled();
  });

  it('sin tipo de escolta el envío sigue deshabilitado aunque lo demás esté completo', async () => {
    const user = userEvent.setup();
    await montar();
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Monterrey');
    fireEvent.change(screen.getByLabelText(/Fecha del servicio/), { target: { value: FECHA } });
    fireEvent.change(screen.getByLabelText(/Hora del servicio/), { target: { value: HORA } });

    expect(botonEnviar()).toBeDisabled();
  });

  it('marca como obligatorios el tipo de escolta, la fecha y la hora', async () => {
    await montar();

    for (const nombre of ['Tipo de escolta', 'Fecha del servicio', 'Hora del servicio']) {
      // El asterisco de requerido vive dentro del <label> (aria-hidden).
      const etiqueta = screen.getAllByText(nombre).find((el) => el.tagName === 'LABEL');
      expect(etiqueta, nombre).toBeDefined();
      expect(etiqueta).toHaveTextContent('*');
    }
  });

  it('vuelve a deshabilitar el envío si el destino se borra', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Origen'), 'CDMX');
    const destino = campo('Destino final');
    await user.type(destino, 'Monterrey');
    await completarObligatorios(user);
    expect(botonEnviar()).toBeEnabled();

    await user.clear(destino);
    expect(botonEnviar()).toBeDisabled();
  });

  it('una parada vacía mantiene el envío deshabilitado', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Guadalajara');
    await completarObligatorios(user);
    expect(botonEnviar()).toBeEnabled();

    // Activar paradas abre una parada vacía: bloquea el envío hasta que tenga texto.
    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' }));
    expect(botonEnviar()).toBeDisabled();

    await user.type(campo('Destino 1'), 'Monterrey');
    expect(botonEnviar()).toBeEnabled();

    // Una segunda parada vacía vuelve a bloquearlo.
    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    expect(botonEnviar()).toBeDisabled();
  });
});

describe('NuevaSolicitudForm · paradas múltiples', () => {
  it('agrega y quita paradas una por una; solo las paradas se numeran', async () => {
    const user = userEvent.setup();
    await montar();

    // Sin paradas: solo Origen y Destino.
    expect(campo('Destino final')).toBeInTheDocument();
    expect(campoAusente('Destino 1')).not.toBeInTheDocument();

    // Activar abre la Parada 1; el Destino conserva su nombre (no se numera).
    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' }));
    expect(campo('Destino 1')).toBeInTheDocument();
    expect(campo('Destino final')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    expect(campo('Destino 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    expect(campo('Destino 3')).toBeInTheDocument();

    // Quitar la parada 2 renumera: la que era 3 pasa a ser la 2.
    await user.click(screen.getByRole('button', { name: 'Quitar destino 2' }));
    expect(campoAusente('Destino 3')).not.toBeInTheDocument();
    expect(campo('Destino 2')).toBeInTheDocument();
  });

  it('quitar la última parada desmarca "Seguimiento con múltiples destinos"', async () => {
    const user = userEvent.setup();
    await montar();

    const casilla = screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' });
    await user.click(casilla);
    expect(casilla).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Quitar destino 1' }));
    expect(casilla).not.toBeChecked();
    expect(campoAusente('Destino 1')).not.toBeInTheDocument();
  });

  it('desactivar "Seguimiento con múltiples destinos" descarta las paradas y conserva el destino', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Destino final'), 'Laredo, US');
    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' }));
    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    expect(campo('Destino 2')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' })); // desactiva
    expect(campoAusente('Destino 1')).not.toBeInTheDocument();
    expect(campoAusente('Destino 2')).not.toBeInTheDocument();
    expect(campo('Destino final')).toHaveValue('Laredo, US');
  });

  it('envía las paradas en orden y el destino final al último', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(campo('Origen'), 'CDMX Vallejo');
    await user.type(campo('Destino final'), 'Laredo, US');
    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' }));
    await user.type(campo('Destino 1'), 'Monterrey');
    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    await user.type(campo('Destino 2'), 'Nuevo Laredo');
    await completarObligatorios(user);

    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    expect(crearViajeMock).toHaveBeenCalledWith({
      origen: 'CDMX Vallejo',
      destinos: [{ nombre: 'Monterrey' }, { nombre: 'Nuevo Laredo' }, { nombre: 'Laredo, US' }],
      fecha_hora_servicio: FECHA_HORA_UTC,
    });
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument();
  });
});

describe('NuevaSolicitudForm · reordenar destinos', () => {
  /** Abre tres destinos con nombre: Monterrey, Saltillo y Nuevo Laredo. */
  async function conTresDestinos(): Promise<ReturnType<typeof userEvent.setup>> {
    const user = userEvent.setup();
    await montar();
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Laredo, US');
    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' }));
    await user.type(campo('Destino 1'), 'Monterrey');
    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    await user.type(campo('Destino 2'), 'Saltillo');
    await user.click(screen.getByRole('button', { name: 'Agregar otro destino' }));
    await user.type(campo('Destino 3'), 'Nuevo Laredo');
    return user;
  }

  it('con un solo destino no hay control de orden', async () => {
    const user = userEvent.setup();
    await montar();
    await user.click(screen.getByRole('switch', { name: 'Seguimiento con múltiples destinos' }));

    expect(screen.queryByRole('button', { name: /Reordenar destino/ })).not.toBeInTheDocument();
  });

  it('las flechas mueven un destino y los destinos se renumeran por posición', async () => {
    await conTresDestinos();

    // ↓ sobre el Destino 1 lo pasa a la posición 2: Saltillo queda primero.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Reordenar destino 1' }), {
      key: 'ArrowDown',
    });

    expect(campo('Destino 1')).toHaveValue('Saltillo');
    expect(campo('Destino 2')).toHaveValue('Monterrey');
    expect(campo('Destino 3')).toHaveValue('Nuevo Laredo');
    expect(screen.getByRole('status')).toHaveTextContent('posición 2 de 3');
  });

  it('el primero no sube y el último no baja', async () => {
    await conTresDestinos();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Reordenar destino 1' }), {
      key: 'ArrowUp',
    });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Reordenar destino 3' }), {
      key: 'ArrowDown',
    });

    expect(campo('Destino 1')).toHaveValue('Monterrey');
    expect(campo('Destino 2')).toHaveValue('Saltillo');
    expect(campo('Destino 3')).toHaveValue('Nuevo Laredo');
  });

  it('arrastrar el Destino 3 sobre el Destino 1 lo coloca primero', async () => {
    await conTresDestinos();

    // jsdom no trae DataTransfer: se entrega un doble con lo que usa el componente.
    const dataTransfer = {
      setData: () => {},
      setDragImage: () => {},
      effectAllowed: '',
      dropEffect: '',
    };
    const control = screen.getByRole('button', { name: 'Reordenar destino 3' });
    const tarjetaDestino1 = campo('Destino 1').closest<HTMLElement>('[data-destino]');
    expect(tarjetaDestino1).not.toBeNull();

    fireEvent.dragStart(control, { dataTransfer });
    fireEvent.dragOver(tarjetaDestino1!, { dataTransfer });
    fireEvent.drop(tarjetaDestino1!, { dataTransfer });

    expect(campo('Destino 1')).toHaveValue('Nuevo Laredo');
    expect(campo('Destino 2')).toHaveValue('Monterrey');
    expect(campo('Destino 3')).toHaveValue('Saltillo');
  });

  it('el envío respeta el orden reordenado y deja el destino final al último', async () => {
    const user = await conTresDestinos();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Reordenar destino 3' }), {
      key: 'ArrowUp',
    });
    await completarObligatorios(user);
    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    expect(crearViajeMock).toHaveBeenCalledWith({
      origen: 'CDMX',
      destinos: [
        { nombre: 'Monterrey' },
        { nombre: 'Nuevo Laredo' },
        { nombre: 'Saltillo' },
        { nombre: 'Laredo, US' },
      ],
      fecha_hora_servicio: FECHA_HORA_UTC,
    });
  });
});

describe('NuevaSolicitudForm · tipo de servicio', () => {
  it('ofrece solo Local y Foráneo', async () => {
    const user = userEvent.setup();
    await montar();

    const grupo = within(screen.getByRole('group', { name: 'Tipo de servicio' }));
    await user.click(grupo.getByRole('button'));

    // Fuera del marcador "Selecciona un tipo", no hay más opciones que esas dos.
    const nombres = grupo
      .getAllByRole('button')
      .map((boton) => boton.textContent?.trim())
      .filter((nombre) => nombre !== 'Selecciona un tipo');
    expect(nombres).toEqual(['Local', 'Foráneo']);
  });

  it('envía el código del tipo elegido en `tipo_servicio`', async () => {
    const user = userEvent.setup();
    await montar();
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Monterrey');
    await elegirOpcion(user, 'Tipo de servicio', 'Foráneo');
    await completarObligatorios(user);

    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    expect(crearViajeMock).toHaveBeenCalledWith({
      origen: 'CDMX',
      destinos: [{ nombre: 'Monterrey' }],
      tipo_servicio: 'foraneo',
      fecha_hora_servicio: FECHA_HORA_UTC,
    });
  });

  it('sigue siendo opcional: sin elegirlo no viaja `tipo_servicio` y el envío se habilita', async () => {
    const user = userEvent.setup();
    await montar();
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Monterrey');
    await completarObligatorios(user);

    expect(botonEnviar()).toBeEnabled();
    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    expect(crearViajeMock.mock.calls[0]?.[0]).not.toHaveProperty('tipo_servicio');
  });

  it('la vista previa muestra la etiqueta del tipo elegido', async () => {
    const user = userEvent.setup();
    await montar();
    const vista = within(
      screen.getByRole('complementary', { name: 'Vista previa de la solicitud' }),
    );

    await elegirOpcion(user, 'Tipo de servicio', 'Local');

    expect(vista.getByText('Local')).toBeInTheDocument();
  });
});

describe('NuevaSolicitudForm · escolta', () => {
  const grupo = (nombre: string): HTMLElement => screen.getByRole('group', { name: nombre });

  const elegir = elegirOpcion;

  async function llenarRuta(user: Usuario): Promise<void> {
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Monterrey');
  }

  it('ofrece Patrulla y Moto como tipos de escolta', async () => {
    const user = userEvent.setup();
    await montar();

    await user.click(within(grupo('Tipo de escolta')).getByRole('button'));

    expect(
      within(grupo('Tipo de escolta')).getByRole('button', { name: 'Patrulla' }),
    ).toBeVisible();
    expect(within(grupo('Tipo de escolta')).getByRole('button', { name: 'Moto' })).toBeVisible();
  });

  it('la sobreescolta está apagada: no muestra su tipo hasta encender el interruptor', async () => {
    const user = userEvent.setup();
    await montar();

    const interruptor = screen.getByRole('switch', { name: 'Agregar sobreescolta' });
    expect(interruptor).not.toBeChecked();
    expect(screen.queryByRole('group', { name: 'Tipo de sobreescolta' })).not.toBeInTheDocument();

    await user.click(interruptor);
    expect(interruptor).toBeChecked();
    expect(grupo('Tipo de sobreescolta')).toBeInTheDocument();
  });

  it('con sobreescolta encendida el envío espera su tipo; apagarla lo libera', async () => {
    const user = userEvent.setup();
    await montar();
    await llenarRuta(user);
    await completarObligatorios(user);
    expect(botonEnviar()).toBeEnabled();

    const interruptor = screen.getByRole('switch', { name: 'Agregar sobreescolta' });
    await user.click(interruptor);
    expect(botonEnviar()).toBeDisabled();

    await elegir(user, 'Tipo de sobreescolta', 'Moto');
    expect(botonEnviar()).toBeEnabled();

    // Apagar y volver a encender descarta el tipo elegido.
    await user.click(interruptor);
    expect(botonEnviar()).toBeEnabled();
    await user.click(interruptor);
    expect(botonEnviar()).toBeDisabled();
  });

  it('la vista previa muestra el tipo de escolta y la sobreescolta', async () => {
    const user = userEvent.setup();
    await montar();
    const vista = within(
      screen.getByRole('complementary', { name: 'Vista previa de la solicitud' }),
    );

    expect(vista.getByText('No')).toBeInTheDocument();

    await elegir(user, 'Tipo de escolta', 'Patrulla');
    await user.click(screen.getByRole('switch', { name: 'Agregar sobreescolta' }));
    await elegir(user, 'Tipo de sobreescolta', 'Moto');

    expect(vista.getByText('Patrulla')).toBeInTheDocument();
    expect(vista.getByText('Moto')).toBeInTheDocument();
  });

  it('la escolta no se envía: el contrato aún no la modela', async () => {
    const user = userEvent.setup();
    await montar();
    await llenarRuta(user);
    await completarObligatorios(user); // incluye el tipo de escolta: Patrulla
    await user.click(screen.getByRole('switch', { name: 'Agregar sobreescolta' }));
    await elegir(user, 'Tipo de sobreescolta', 'Moto');

    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    // Solo viajan los campos del contrato: ni `escolta` ni `sobreescolta`.
    expect(crearViajeMock).toHaveBeenCalledWith({
      origen: 'CDMX',
      destinos: [{ nombre: 'Monterrey' }],
      fecha_hora_servicio: FECHA_HORA_UTC,
    });
  });
});

describe('NuevaSolicitudForm · fecha y hora', () => {
  // Los campos `date` y `time` no tienen rol ARIA propio: se buscan por su etiqueta.
  const campoFecha = (): HTMLInputElement => screen.getByLabelText(/Fecha del servicio/);
  const campoHora = (): HTMLInputElement => screen.getByLabelText(/Hora del servicio/);

  /** Ruta y tipo de escolta; la fecha y la hora las pone cada prueba. */
  async function llenarRuta(): Promise<void> {
    const user = userEvent.setup();
    await user.type(campo('Origen'), 'CDMX');
    await user.type(campo('Destino final'), 'Monterrey');
    await elegirOpcion(user, 'Tipo de escolta', 'Patrulla');
  }

  it('envía Fecha y Hora como un solo `fecha_hora_servicio` en UTC', async () => {
    const user = userEvent.setup();
    await montar();
    await llenarRuta();

    fireEvent.change(campoFecha(), { target: { value: FECHA } });
    fireEvent.change(campoHora(), { target: { value: HORA } });
    await user.click(botonEnviar());

    await waitFor(() => expect(crearViajeMock).toHaveBeenCalledTimes(1));
    expect(crearViajeMock).toHaveBeenCalledWith({
      origen: 'CDMX',
      destinos: [{ nombre: 'Monterrey' }],
      // Hora de pared del navegador convertida a UTC; independiente de la zona de la prueba.
      fecha_hora_servicio: FECHA_HORA_UTC,
    });
  });

  it('sin fecha ni hora el envío queda bloqueado y no llama al servicio', async () => {
    await montar();
    await llenarRuta();

    expect(botonEnviar()).toBeDisabled();
    expect(crearViajeMock).not.toHaveBeenCalled();
  });

  it('con solo la fecha bloquea el envío y pide la hora; al completarla se habilita', async () => {
    await montar();
    await llenarRuta();
    expect(botonEnviar()).toBeDisabled();

    fireEvent.change(campoFecha(), { target: { value: '2026-11-20' } });
    expect(botonEnviar()).toBeDisabled();
    expect(screen.getByText('Indica también la hora.')).toBeInTheDocument();

    fireEvent.change(campoHora(), { target: { value: '09:30' } });
    expect(botonEnviar()).toBeEnabled();
    expect(screen.queryByText('Indica también la hora.')).not.toBeInTheDocument();
  });

  it('con solo la hora bloquea el envío y pide la fecha', async () => {
    await montar();
    await llenarRuta();

    fireEvent.change(campoHora(), { target: { value: '09:30' } });
    expect(botonEnviar()).toBeDisabled();
    expect(screen.getByText('Indica también la fecha.')).toBeInTheDocument();
  });

  it('un año de 5 dígitos bloquea el envío con un aviso y no llama al servicio', async () => {
    await montar();
    await llenarRuta();

    fireEvent.change(campoFecha(), { target: { value: '20266-11-20' } });
    fireEvent.change(campoHora(), { target: { value: '09:30' } });

    expect(botonEnviar()).toBeDisabled();
    expect(
      screen.getByText('Escribe una fecha válida: el año debe tener 4 dígitos.'),
    ).toBeInTheDocument();
    expect(crearViajeMock).not.toHaveBeenCalled();

    // Corregir el año habilita el envío.
    fireEvent.change(campoFecha(), { target: { value: '2026-11-20' } });
    expect(botonEnviar()).toBeEnabled();
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
    await user.type(campo('Destino final'), 'Monterrey');
    await completarObligatorios(user);

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
