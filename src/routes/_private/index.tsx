/*
 * La home de la sesion autenticada redirige al Historial de Viajes.
 *
 * El Panel de Control vivia aqui y pegaba a `GET /api/v1/panel`, un endpoint que NO
 * existe en el contrato (`contracts/openapi/bff.yaml`): se construyo contra un mock mas
 * rico de lo que V1 sabe. Mientras la decision de §9 del plan sigue diferida —congelar
 * `/panel` como superficie de composicion del `bff`, o recomponer el panel con las
 * superficies que V1 si tiene— se cierra el acceso a esa pantalla para no dejar en
 * produccion una home que se rompe contra el `bff` real.
 *
 * No se borra el panel: `features/panel/`, `lib/api/panel.ts`, `lib/panel/parsePanel.ts`
 * y `lib/contracts/panel.ts` quedan congelados para cuando se tome esa decision. Esta
 * ruta solo deja de cablear el acceso y manda a `/viajes`, que SI es una ruta real del
 * contrato (`GET /api/v1/viajes`).
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/')({
  loader: () => {
    throw redirect({ to: '/viajes' });
  },
});
