/*
 * Aviso de privacidad y seguridad. Puramente informativo.
 */

import { Lock } from 'lucide-react';

export function PrivacidadCard() {
  return (
    <div className="bg-info-container text-on-info-container flex gap-3 rounded-lg p-4">
      <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">Privacidad y Seguridad</p>
        <p className="text-xs">
          Esta información es utilizada exclusivamente para coordinar el protocolo de seguridad y no
          se comparte con terceros.
        </p>
      </div>
    </div>
  );
}
