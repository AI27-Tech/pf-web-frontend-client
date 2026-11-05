/*
 * El aviso de degradacion, en el shell y no en cada pantalla.
 *
 * Esta aqui porque la degradacion es una propiedad de la sesion: si el stream se
 * cae, se cae para todo. Y esta VISIBLE porque la alternativa es un usuario mirando
 * datos viejos sin saberlo, que es el modo de falla que el diseno persigue con mas
 * insistencia: callarse si, mentir no.
 */

import { useDegradation } from '@/context/DegradationContext';
import { shouldWarnUser } from '@/lib/degradation/mode';

export function DegradationBanner() {
  const degradation = useDegradation();

  if (!shouldWarnUser(degradation)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-degradado-50 text-degradado-800 border-degradado-600/30 border-b px-4 py-2 text-sm"
    >
      {degradation.reason}
    </div>
  );
}
