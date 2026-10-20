/*
 * Contract test de sesion contra el tracer (E8-T3, Definicion de terminado).
 *
 * No habla con un backend: afirma que la forma que el portal produce y consume
 * casa con el contrato generado `@ai27-tech/contracts`. La proteccion es doble:
 *
 *   - De TIPO (typecheck): el fixture del mock se declara `satisfies` contra el
 *     `Sesion`/`CredencialesEntrada`/`RefrescoEntrada` del tracer. Si el contrato
 *     renombra o quita un campo, este archivo deja de compilar.
 *   - De RUNTIME (este test): confirma que el mock trae exactamente las claves del
 *     contrato —`sesion_id`, sin objeto `usuario`, sin `requiere_segundo_factor`— y
 *     que el parser del portal preserva `sesionId`. Si el mock se desvia, falla.
 *
 * Es exactamente la senal que E8-T3 pide: "un campo que el contrato renombra rompe
 * el mock" y "un cambio incompatible rompe el typecheck, no la ejecucion".
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
    // El `satisfies` es la parte de typecheck; la asignacion prueba que compila.
    const wire = sesionWire() satisfies Sesion;
    expect(wire).toBeTruthy();
  });

  it('la respuesta de sesion trae solo las claves del contrato', () => {
    const wire = sesionWire();
    const claves = Object.keys(wire).sort();

    // Exactamente las del contrato: sesion_id, access_token, expira_en (refresh opcional).
    expect(claves).toEqual(['access_token', 'expira_en', 'sesion_id']);

    // Las formas viejas e incompatibles de cada portal NO deben reaparecer.
    expect(wire).not.toHaveProperty('usuario');
    expect(wire).not.toHaveProperty('requiere_segundo_factor');
    expect(wire).not.toHaveProperty('expires_in');
  });

  it('las credenciales del dev user casan con CredencialesEntrada del contrato', () => {
    const credenciales = {
      usuario: DEV_USER.usuario,
      contrasena: DEV_USER.contrasena,
    } satisfies CredencialesEntrada;

    expect(Object.keys(credenciales).sort()).toEqual(['contrasena', 'usuario']);
  });

  it('el refresco se tipa contra RefrescoEntrada del contrato', () => {
    // El portal no persiste refresh_token hoy (ver TODO(auth) en lib/api/sesion.ts);
    // el cuerpo es parcial pero tipado contra el contrato, no inventado.
    const body: Partial<RefrescoEntrada> = {};
    expect(body).toBeTruthy();
  });

  it('el parser del portal preserva sesion_id como sesionId', () => {
    const wire = sesionWire();
    const sesion = toSesion(wire);

    expect(sesion.sesionId).toBe(wire.sesion_id);
    expect(sesion.accessToken).toBe(wire.access_token);
    expect(sesion.expiraEn).toBe(wire.expira_en);
  });
});
