/*
 * El mapa. PLACEHOLDER deliberado.
 *
 * MapLibre esta instalado, pero este componente no lo monta todavia, y la razon es de
 * diseno y no de tiempo: la regla mas dura del seguimiento es que un marcador NO se
 * interpola sobre una posicion vieja. Un mapa que anima suavemente entre dos puntos
 * separados por 35 segundos es exactamente el "mapa que miente" que el diseno declara
 * peor que un mapa que se calla.
 *
 * Asi que antes de montar el mapa hay que decidir tres cosas:
 *   1. Como se dibuja una posicion presente pero vieja (¿marcador atenuado? ¿halo de
 *      incertidumbre creciente con la edad?).
 *   2. Que se dibuja cuando la posicion esta ausente por degradacion — probablemente
 *      NADA en el marcador, mas el aviso de FreshnessMark.
 *   3. Si la traza se dibuja como polilinea interpolada o como puntos discretos. La
 *      polilinea es mas bonita y afirma cosas que no sabemos.
 *
 * Ninguna de las tres esta resuelta en docs/arquitectura/, y elegirlas aqui por
 * defecto es como se cuela la mentira. TODO(diseno): cerrarlas antes de implementar.
 */

import type { Fresco, Posicion } from '@/lib/contracts';

export function MapaSeguimiento({ posicion }: { readonly posicion: Fresco<Posicion> }) {
  return (
    <div
      role="img"
      aria-label={
        posicion.estado === 'presente'
          ? `Mapa del viaje. Ultima posicion conocida: ${posicion.valor.lat}, ${posicion.valor.lon}`
          : 'Mapa del viaje. Sin posicion disponible.'
      }
      className="bg-surface-container-high text-on-surface-variant flex h-72 items-center justify-center rounded-lg text-sm"
    >
      {posicion.estado === 'presente' ? (
        <span>
          {posicion.valor.lat.toFixed(5)}, {posicion.valor.lon.toFixed(5)}
        </span>
      ) : (
        <span>Sin posicion que dibujar</span>
      )}
    </div>
  );
}
