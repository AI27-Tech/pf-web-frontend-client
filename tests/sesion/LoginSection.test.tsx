/*
 * LoginSection — login del portal con segundo factor (E9-T2).
 *
 * Se afirma el COMPORTAMIENTO que exige la HU, no el detalle de implementación:
 *   - El segundo factor viaja JUNTO a las credenciales en una sola llamada a `login`
 *     (un solo `POST /sesion`): el portal no construye tramo propio de OTP.
 *   - El código vacío se OMITE del cuerpo (el contrato lo declara opcional).
 *   - ENUMERACIÓN DE CUENTAS: ante credenciales inválidas, el mensaje es IDÉNTICO
 *     exista o no el usuario, y es el MISMO para un segundo factor inválido o vencido.
 *     Distinguirlos sería un oráculo de existencia de cuentas (DEC-094).
 *   - Un IdP no disponible NO culpa al usuario: el mensaje habla del servicio.
 *
 * `useSession` se sustituye por un doble: aquí se prueba el formulario y su manejo de
 * resultados, no la red ni el contexto de sesión. El `login` del doble es el punto de
 * observación de lo que el formulario envía y la fuente de los fallos que simula.
 *
 * Los campos se consultan por su ROL y nombre accesible, no por `getByLabelText`: el
 * `FormField` de `@ai27-tech/ui` añade un asterisco de requerido dentro del `<label>`
 * (aria-hidden), así que el rol evita esa fragilidad.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api/errors';
import type { Credenciales, SesionEmitida } from '@/lib/api/sesion';
import { LoginSection } from '@/features/sesion/LoginSection';
import { renderConRouter } from '../support/router';

const loginMock = vi.fn<(credenciales: Credenciales) => Promise<SesionEmitida>>();
vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({ isAuthenticated: false, login: loginMock, logout: vi.fn() }),
}));

function sesionEmitida(): SesionEmitida {
  return {
    sesionId: 'ses-test-1',
    accessToken: 'test.jwt',
    expiraEn: new Date(Date.now() + 15 * 60_000).toISOString(),
    refreshToken: 'test.refresh',
  };
}

const campo = (nombre: string | RegExp): HTMLInputElement =>
  screen.getByRole('textbox', { name: nombre });
const campoPassword = (): HTMLInputElement =>
  screen.getByLabelText('Contrasena', { exact: true }) as HTMLInputElement;
const botonEntrar = (): HTMLButtonElement => screen.getByRole('button', { name: /Iniciar sesion/ });

/** Texto del `role="alert"` que pinta el error, o null si no hay. */
const textoDeError = (): string | null => screen.queryByRole('alert')?.textContent ?? null;

async function montar(): Promise<void> {
  renderConRouter(<LoginSection />);
  await screen.findByRole('textbox', { name: 'Correo electronico empresarial' });
}

/** Llena los tres campos y envía. El segundo factor es opcional. */
async function enviar(
  user: ReturnType<typeof userEvent.setup>,
  datos: { usuario: string; password: string; codigo?: string },
): Promise<void> {
  await user.type(campo('Correo electronico empresarial'), datos.usuario);
  await user.type(campoPassword(), datos.password);
  if (datos.codigo !== undefined && datos.codigo.length > 0) {
    await user.type(campo('Codigo de verificacion'), datos.codigo);
  }
  await user.click(botonEntrar());
}

beforeEach(() => {
  loginMock.mockReset();
  loginMock.mockResolvedValue(sesionEmitida());
});

describe('LoginSection · segundo factor en un solo paso', () => {
  it('envía usuario, contrasena y segundo_factor juntos en una sola llamada', async () => {
    const user = userEvent.setup();
    await montar();

    await enviar(user, { usuario: 'cliente@demo.ai27', password: 'demo1234', codigo: '123456' });

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock).toHaveBeenCalledWith({
      usuario: 'cliente@demo.ai27',
      contrasena: 'demo1234',
      segundo_factor: '123456',
    });
  });

  it('omite segundo_factor del cuerpo cuando el campo queda vacío', async () => {
    const user = userEvent.setup();
    await montar();

    await enviar(user, { usuario: 'cliente@demo.ai27', password: 'demo1234' });

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    const enviado = loginMock.mock.calls[0]?.[0];
    expect(enviado).toEqual({ usuario: 'cliente@demo.ai27', contrasena: 'demo1234' });
    expect(enviado).not.toHaveProperty('segundo_factor');
  });
});

describe('LoginSection · no enumeración de cuentas', () => {
  /*
   * El corazón de la Definición de terminado: el mensaje de credenciales inválidas NO
   * distingue a un usuario que existe de uno que no. Se provoca el mismo 401 uniforme
   * (lo que `identidad` devuelve, DEC-094) con un usuario "existente" y uno
   * "inexistente", y se compara el texto exacto. Si algún día alguien hace el mensaje
   * condicional a la causa, estas dos aserciones divergen y el test cae.
   */
  const unauthorized = (): ApiError =>
    new ApiError('noAutorizado', 'credenciales invalidas', 401, null);

  it('muestra el MISMO mensaje exista o no el usuario', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(unauthorized());

    await montar();
    await enviar(user, { usuario: 'existe@demo.ai27', password: 'mala', codigo: '000000' });
    const mensajeUsuarioExistente = await screen.findByRole('alert');
    const textoExistente = mensajeUsuarioExistente.textContent;

    // Segundo intento, usuario que no existe: debe producir el mismo texto.
    await user.clear(campo('Correo electronico empresarial'));
    await user.clear(campoPassword());
    await user.clear(campo('Codigo de verificacion'));
    await enviar(user, { usuario: 'noexiste@demo.ai27', password: 'otra', codigo: '111111' });

    await waitFor(() => {
      expect(textoDeError()).toBe(textoExistente);
    });
    expect(textoExistente).toBe('Usuario, contrasena o codigo de verificacion incorrectos.');
  });

  it('un segundo factor inválido o vencido da el mismo mensaje que una credencial mala', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(unauthorized());

    await montar();
    // Credenciales buenas, segundo factor malo: `identidad` responde el MISMO 401.
    await enviar(user, { usuario: 'cliente@demo.ai27', password: 'demo1234', codigo: '999999' });

    await waitFor(() => {
      expect(textoDeError()).toBe('Usuario, contrasena o codigo de verificacion incorrectos.');
    });
  });
});

describe('LoginSection · fallo del proveedor de identidad', () => {
  it('ante un IdP no disponible, el mensaje habla del servicio y no culpa al usuario', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new ApiError('degradado', 'IdP caído', 503, null));

    await montar();
    await enviar(user, { usuario: 'cliente@demo.ai27', password: 'demo1234', codigo: '123456' });

    await waitFor(() => {
      const texto = textoDeError() ?? '';
      expect(texto).toMatch(/servicio de identidad no esta disponible/i);
      // No culpa al usuario: no habla de credenciales ni de código incorrecto.
      expect(texto).not.toMatch(/incorrect/i);
    });
  });
});
