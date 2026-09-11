/*
 * El estado del asistente "Solicitar nuevo servicio".
 *
 * No prueba UI: prueba que el reducer es puro y que cada accion toca SOLO su seccion,
 * que el toggle de requisitos no duplica ni pierde codigos, y que el ID simulado
 * respeta el formato del diseno.
 */

import { describe, expect, it } from 'vitest';
import {
  BORRADOR_INICIAL,
  esBorradorVacio,
  generarIdSolicitud,
  reducerBorrador,
} from '@/features/viajes/solicitud/borrador';

describe('reducerBorrador', () => {
  it('actualiza un campo de servicio sin tocar el resto de secciones', () => {
    const siguiente = reducerBorrador(BORRADOR_INICIAL, {
      tipo: 'servicio',
      campo: 'contactoNombre',
      valor: 'Ana G.',
    });

    expect(siguiente.servicio.contactoNombre).toBe('Ana G.');
    expect(siguiente.origen).toBe(BORRADOR_INICIAL.origen);
    expect(siguiente.carga).toBe(BORRADOR_INICIAL.carga);
  });

  it('no muta el estado anterior', () => {
    const antes = JSON.stringify(BORRADOR_INICIAL);
    reducerBorrador(BORRADOR_INICIAL, { tipo: 'origen', campo: 'nombreLugar', valor: 'CEDIS' });
    expect(JSON.stringify(BORRADOR_INICIAL)).toBe(antes);
  });

  it('origen y destino son independientes', () => {
    const conOrigen = reducerBorrador(BORRADOR_INICIAL, {
      tipo: 'origen',
      campo: 'ciudadEstado',
      valor: 'Monterrey, N.L.',
    });
    const conDestino = reducerBorrador(conOrigen, {
      tipo: 'destino',
      campo: 'ciudadEstado',
      valor: 'Guadalajara, Jal.',
    });

    expect(conDestino.origen.ciudadEstado).toBe('Monterrey, N.L.');
    expect(conDestino.destino.ciudadEstado).toBe('Guadalajara, Jal.');
  });

  it('marca un requisito de manejo sin duplicarlo', () => {
    const marcado = reducerBorrador(BORRADOR_INICIAL, {
      tipo: 'carga-requisito',
      codigo: 'fragil',
      activo: true,
    });
    const marcadoDeNuevo = reducerBorrador(marcado, {
      tipo: 'carga-requisito',
      codigo: 'fragil',
      activo: true,
    });

    expect(marcadoDeNuevo.carga.requisitos).toEqual(['fragil']);
  });

  it('desmarca un requisito de manejo dejando el resto', () => {
    let estado = reducerBorrador(BORRADOR_INICIAL, {
      tipo: 'carga-requisito',
      codigo: 'fragil',
      activo: true,
    });
    estado = reducerBorrador(estado, {
      tipo: 'carga-requisito',
      codigo: 'alto-valor',
      activo: true,
    });
    estado = reducerBorrador(estado, {
      tipo: 'carga-requisito',
      codigo: 'fragil',
      activo: false,
    });

    expect(estado.carga.requisitos).toEqual(['alto-valor']);
  });

  it('reinicia al borrador inicial', () => {
    const editado = reducerBorrador(BORRADOR_INICIAL, {
      tipo: 'documentacion',
      campo: 'comentarios',
      valor: 'Factura adjunta',
    });
    expect(esBorradorVacio(editado)).toBe(false);

    const reiniciado = reducerBorrador(editado, { tipo: 'reiniciar' });
    expect(esBorradorVacio(reiniciado)).toBe(true);
  });
});

describe('generarIdSolicitud', () => {
  it('respeta el formato AI27-YYMMDD-NNN', () => {
    expect(generarIdSolicitud()).toMatch(/^AI27-\d{6}-\d{3}$/);
  });

  it('deriva YYMMDD de la fecha dada', () => {
    // 18 de septiembre de 2024 -> 240918.
    const id = generarIdSolicitud(new Date(2024, 8, 18));
    expect(id.startsWith('AI27-240918-')).toBe(true);
  });
});
