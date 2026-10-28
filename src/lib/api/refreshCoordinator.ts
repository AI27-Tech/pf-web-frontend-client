import { refresh } from './sesion';
import type { SesionEmitida } from './sesion';

let refrescoEnVuelo: Promise<SesionEmitida> | null = null;

/** Comparte un único refresco entre peticiones que reciben 401 en paralelo. */
export function refrescarSesionCoordinado(): Promise<SesionEmitida> {
  if (refrescoEnVuelo !== null) return refrescoEnVuelo;

  const actual = refresh();
  const coordinado = actual.finally(() => {
    if (refrescoEnVuelo === coordinado) refrescoEnVuelo = null;
  });
  refrescoEnVuelo = coordinado;
  return coordinado;
}
