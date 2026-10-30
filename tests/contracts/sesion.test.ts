/*
 * Contract test de sesion contra el tracer (E8-T3, Definicion de terminado).
 *
 * Afirma que la forma que el portal produce y consume casa con el contrato
 * generado `@ai27-tech/contracts`.
 */

import { describe, expect, it } from 'vitest';
import type { components } from '@ai27-tech/contracts/openapi/bff';

import { DEV_USER, sesionWire } from '@/mocks/data';
import { toSesion } from '@/lib/api/sesion';

type Sesion = components['schemas']['Sesion'];
type CredencialesEntrada = components['schemas']['CredencialesEntrada'];
type RefrescoEntrada = components['schemas']['RefrescoEntrada'];

describe('contrato de sesion (tracer)', () => {
  it('el fixture del mock satisface el tipo Sesion del contrato', () => {
    const wire = sesionWire() satisfies Sesion;
    expect(wire).toBeTruthy();
  });

  it('la respuesta de sesion trae solo las claves del contrato', () => {
    const wire = sesionWire();
    const claves = Object.keys(wire).sort();

    expect(claves).toEqual(['access_token', 'expira_en', 'refresh_token', 'sesion_id']);
    expect(wire).not.toHaveProperty('usuario');
    expect(wire).not.toHaveProperty('requiere_segundo_factor');
    expect(wire).not.toHaveProperty('expires_in');
  });

  it('emite refresh_token cuando el wire lo trae', () => {
    expect(sesionWire().refresh_token).toBe('mock.refresh-1');
  });

  it('las credenciales del dev user casan con CredencialesEntrada', () => {
    const credenciales = {
      usuario: DEV_USER.usuario,
      contrasena: DEV_USER.contrasena,
    } satisfies CredencialesEntrada;

    expect(Object.keys(credenciales).sort()).toEqual(['contrasena', 'usuario']);
  });

  it('CredencialesEntrada admite segundo_factor opcional (TOTP, tracer.20)', () => {
    // El segundo factor viaja JUNTO a las credenciales en un solo POST /sesion: el
    // portal no construye tramo propio de OTP (DEC-031/DEC-071). El contrato lo
    // declara opcional, asi que ambas formas —con y sin codigo— deben tipar.
    const sinCodigo = {
      usuario: DEV_USER.usuario,
      contrasena: DEV_USER.contrasena,
    } satisfies CredencialesEntrada;

    const conCodigo = {
      usuario: DEV_USER.usuario,
      contrasena: DEV_USER.contrasena,
      segundo_factor: DEV_USER.segundoFactor,
    } satisfies CredencialesEntrada;

    expect(sinCodigo).toBeTruthy();
    expect(conCodigo.segundo_factor).toBe('123456');
  });

  it('el refresco usa el refresh_token del contrato', () => {
    const body: RefrescoEntrada = { refresh_token: 'mock.refresh-1' };
    expect(body).toEqual({ refresh_token: 'mock.refresh-1' });
  });

  it('el parser del portal preserva la sesion completa', () => {
    const wire = sesionWire();
    const sesion = toSesion(wire);

    expect(sesion.sesionId).toBe(wire.sesion_id);
    expect(sesion.accessToken).toBe(wire.access_token);
    expect(sesion.expiraEn).toBe(wire.expira_en);
    expect(sesion.refreshToken).toBe(wire.refresh_token);
  });
});
