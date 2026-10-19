/*
 * Las dos secuencias, y que el orden en pantalla sale de la de dominio (P5).
 *
 * El caso interesante es el ultimo: mensajes que llegan por el cable en un orden y
 * cuya secuencia de dominio dice otro. Ordenar por llegada —o por el `seq` del
 * sobre— produce mensajes bien ordenados en la conexion y mal ordenados en la
 * pantalla, que es exactamente el bug que estos tipos existen para impedir.
 *
 * Esta prueba se queda en V1: `orderByDomainSequence` y `findDomainSequenceGaps` los
 * usa la conversacion de negocio (mensajeria), no el seguimiento vivo V2.
 */

import { describe, expect, it } from 'vitest';
import {
  findDomainSequenceGaps,
  orderByDomainSequence,
  toDomainSeq,
  toTransportSeq,
} from '@/lib/contracts';

describe('orderByDomainSequence', () => {
  it('ordena por secuencia de dominio, no por orden de llegada', () => {
    // Orden de llegada: 3, 1, 2. Orden de dominio: 1, 2, 3.
    const llegada = [
      { id: 'c', seq: toDomainSeq(3) },
      { id: 'a', seq: toDomainSeq(1) },
      { id: 'b', seq: toDomainSeq(2) },
    ];

    expect(orderByDomainSequence(llegada).map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('ante la misma identidad conserva la secuencia mayor', () => {
    const conRepetido = [
      { id: 'a', seq: toDomainSeq(5) },
      { id: 'a', seq: toDomainSeq(3) },
    ];

    const ordenado = orderByDomainSequence(conRepetido);
    expect(ordenado).toHaveLength(1);
    expect(ordenado[0]?.seq).toBe(5);
  });
});

describe('findDomainSequenceGaps', () => {
  it('detecta huecos, que se cierran por lectura durable y no por el stream', () => {
    const ordenado = [{ seq: toDomainSeq(1) }, { seq: toDomainSeq(2) }, { seq: toDomainSeq(5) }];

    expect(findDomainSequenceGaps(ordenado)).toEqual([3, 4]);
  });

  it('no reporta huecos en una secuencia contigua', () => {
    expect(findDomainSequenceGaps([{ seq: toDomainSeq(7) }, { seq: toDomainSeq(8) }])).toEqual([]);
  });
});

describe('constructores de secuencia', () => {
  it('rechaza valores que no son enteros no negativos', () => {
    expect(() => toDomainSeq(-1)).toThrow(TypeError);
    expect(() => toTransportSeq(1.5)).toThrow(TypeError);
  });

  /*
   * No hay test de "convertir TransportSeq en DomainSeq" porque no hay funcion que lo
   * haga: la ausencia es el mecanismo. Intentar pasar un TransportSeq donde se espera
   * un DomainSeq es un error de compilacion, no un fallo en tiempo de ejecucion.
   */
});
