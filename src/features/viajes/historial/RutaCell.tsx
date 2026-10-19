/*
 * RutaCell: la celda "RUTA (ORIGEN → DESTINO)" del Historial de Viajes.
 *
 * Pinta origen y destino en dos lineas cada uno —lugar arriba, sitio concreto
 * debajo— con una flecha decorativa entre ellos.
 */

import { ArrowRight } from 'lucide-react';

interface RutaCellProps {
  readonly origen: string;
  readonly origenSitio: string | null;
  readonly destino: string;
  readonly destinoSitio: string | null;
}

function Lugar({ lugar, sitio }: { readonly lugar: string; readonly sitio: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-on-surface font-semibold">{lugar}</span>
      {sitio !== null && <span className="text-on-surface-variant text-xs">{sitio}</span>}
    </div>
  );
}

export function RutaCell({ origen, origenSitio, destino, destinoSitio }: RutaCellProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <Lugar lugar={origen} sitio={origenSitio} />
      <ArrowRight
        aria-hidden="true"
        className="text-on-surface-variant hidden size-4 shrink-0 sm:block"
      />
      <Lugar lugar={destino} sitio={destinoSitio} />
    </div>
  );
}
