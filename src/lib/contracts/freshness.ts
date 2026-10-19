/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * "Ausente por degradacion no es ausente."
 *
 * Es la regla de §C.3 y de §DEGRADATION-TAXONOMY, y es la razon de que este tipo
 * tenga TRES estados y no dos. Presentar una posicion faltante como "sin posicion"
 * produce exactamente el mapa que miente, que el diseno declara peor que un mapa
 * que se calla.
 *
 * La consecuencia para la UI es directa: `ausente-por-degradacion` se RENDERIZA.
 * No se colapsa con `sin-dato`, no se oculta, y no se interpola por encima.
 */

/** Un dato que puede faltar — y cuya ausencia viaja marcada. */
export type Fresco<T> =
  | {
      readonly estado: 'presente';
      readonly valor: T;
      /** Cuando lo observo el sistema, no cuando lo recibimos nosotros. */
      readonly observadoEn: string;
    }
  | {
      readonly estado: 'ausente-por-degradacion';
      /** Que dependencia esta caida, para que la UI pueda decirlo sin mentir. */
      readonly motivo: string;
      /** Ultima observacion conocida, si la hubo. Se muestra SIEMPRE etiquetada. */
      readonly ultimoDatoEn: string | null;
    }
  | {
      /** Nunca hubo dato. Distinto de que no podamos alcanzarlo ahora. */
      readonly estado: 'sin-dato';
    };

export function presente<T>(valor: T, observadoEn: string): Fresco<T> {
  return { estado: 'presente', valor, observadoEn };
}

export function ausentePorDegradacion<T>(
  motivo: string,
  ultimoDatoEn: string | null = null,
): Fresco<T> {
  return { estado: 'ausente-por-degradacion', motivo, ultimoDatoEn };
}

export function sinDato<T>(): Fresco<T> {
  return { estado: 'sin-dato' };
}

/**
 * Extrae el valor solo si esta presente. Deliberadamente NO acepta un valor por
 * defecto: un default convierte "no lo sabemos" en "esto es", que es la mentira
 * que este tipo existe para impedir.
 */
export function valorSiPresente<T>(fresco: Fresco<T>): T | null {
  return fresco.estado === 'presente' ? fresco.valor : null;
}

/** True si la UI debe mostrar una marca de degradacion junto a este dato. */
export function requiereMarcaDeDegradacion<T>(fresco: Fresco<T>): boolean {
  return fresco.estado === 'ausente-por-degradacion';
}
