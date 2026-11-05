/*
 * La guarda de rutas privadas.
 *
 * Todo lo que cuelga de aqui exige sesion. Es un layout con `beforeLoad`, que corre
 * ANTES de que el loader de la ruta hija dispare su fetch — la alternativa
 * (comprobar dentro del componente) lanza la peticion primero y redirige despues.
 *
 * Lo que esta guarda NO es: autorizacion. Solo comprueba que hay sesion. Quien puede
 * ver que viaje lo decide el servidor a partir de los claims del token; el cliente no
 * evalua alcance, no filtra por tenant y no interpreta roles (P9, P10). Si alguna vez
 * aparece aqui un `if (rol === ...)`, el modelo se rompio.
 */

import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/app/shell/AppShell';
import { tokenStore } from '@/lib/api/tokenStore';

export const Route = createFileRoute('/_private')({
  beforeLoad: ({ location }) => {
    /*
     * Presencia de token, no validez: la validez la decide el servidor al verificar
     * la firma. Comprobar aqui la expiracion es una cortesia para no disparar una
     * peticion condenada, nunca una decision de seguridad.
     */
    if (tokenStore.getAccessToken() === null) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  // AppShell ya renderiza su propio <Outlet />: es el layout, no un contenedor.
  component: AppShell,
});
