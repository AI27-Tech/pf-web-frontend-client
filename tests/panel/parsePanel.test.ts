/*
 * El parser del panel, probado por lo que puede romper.
 */

import { describe, expect, it } from 'vitest';
import { PanelPayloadError, parsePanel } from '@/lib/panel/parsePanel';
import { panelWire } from '@/mocks/data';
import { panelWireCompleto } from '../fixtures/panelWire';

describe('parsePanel · indicadores', () => {
  it('convierte los indicadores a la forma de la app', () => {
    const panel = parsePanel(panelWireCompleto);

    expect(panel.viajesActivos).toStrictEqual({ total: 24, deltaDesdeAyer: 3 });
    expect(panel.riesgoGlobal).toStrictEqual({ nivel: 'BAJO_NORMAL', unidadesSegurasPct: 98 });
    expect(panel.alertasActivas).toStrictEqual({ total: 2 });
  });

  it('deja pasar un nivel de riesgo desconocido en lugar de romper', () => {
    const wire = {
      ...panelWireCompleto,
      riesgo_global: { nivel: 'ELEVADO_POR_CLIMA', unidades_seguras_pct: 61 },
    };

    // La union es abierta a proposito: el contrato de estados no existe todavia.
    expect(parsePanel(wire).riesgoGlobal.nivel).toBe('ELEVADO_POR_CLIMA');
  });
});

describe('parsePanel · viajes en curso y los tres estados del ETA', () => {
  it('mapea los campos de cada viaje', () => {
    const [primero] = parsePanel(panelWireCompleto).viajesEnCurso;

    expect(primero).toMatchObject({
      viajeId: 'viaje-1',
      folio: 'AI27-000101',
      origen: 'CDMX · Vallejo',
      destino: 'Queretaro · Parque Industrial',
      estado: 'EN_RUTA',
    });
    expect(primero?.condicionesActivas).toStrictEqual([]);
  });

  it('el ETA presente conserva su valor y su marca de observacion', () => {
    const [primero] = parsePanel(panelWireCompleto).viajesEnCurso;

    expect(primero?.eta.estado).toBe('presente');
    if (primero?.eta.estado === 'presente') {
      expect(primero.eta.valor.estimadoEn).toBe('2026-09-09T18:30:00Z');
      expect(primero.eta.observadoEn).toBe('2026-09-09T12:00:00Z');
    }
  });

  it('preserva la ausencia por degradacion en lugar de colapsarla a null', () => {
    const segundo = parsePanel(panelWireCompleto).viajesEnCurso[1];

    expect(segundo?.eta.estado).toBe('ausente-por-degradacion');
    if (segundo?.eta.estado === 'ausente-por-degradacion') {
      expect(segundo.eta.motivo).toBe('procesamiento no disponible');
      expect(segundo.eta.ultimoDatoEn).toBe('2026-09-09T10:20:00Z');
    }
    expect(segundo?.estado).toBe('EN_RUTA');
    expect(segundo?.condicionesActivas[0]?.codigo).toBe('RETRASADO');
  });

  it('distingue "sin dato" de "degradado"', () => {
    const tercero = parsePanel(panelWireCompleto).viajesEnCurso[2];

    expect(tercero?.eta.estado).toBe('sin-dato');
  });
});

describe('parsePanel · notificaciones', () => {
  it('mapea severidad, cuerpo y marca temporal', () => {
    const [critica, informativa] = parsePanel(panelWireCompleto).notificaciones;

    expect(critica).toStrictEqual({
      id: 'notif-1',
      severidad: 'critica',
      titulo: 'Desvio de ruta detectado',
      cuerpo: 'La unidad del viaje AI27-000102 salio de la geocerca en un tramo peligroso.',
      ocurrioEn: '2026-09-09T11:58:00Z',
    });
    expect(informativa?.severidad).toBe('informativa');
  });

  it('deja pasar una severidad desconocida', () => {
    const wire = {
      ...panelWireCompleto,
      notificaciones: [
        {
          id: 'notif-9',
          severidad: 'urgentisima',
          titulo: 'Algo nuevo',
          cuerpo: 'Una severidad que el cliente no conoce todavia.',
          ocurrio_en: '2026-09-09T11:00:00Z',
        },
      ],
    };

    expect(parsePanel(wire).notificaciones[0]?.severidad).toBe('urgentisima');
  });
});

describe('parsePanel · el backend simulado habla el mismo idioma', () => {
  it('el dataset de mocks/data.ts atraviesa el parser', () => {
    const panel = parsePanel(panelWire());

    expect(panel.viajesActivos.total).toBe(24);
    // Cinco filas: los tres viajes compartidos con el resto del dataset, mas
    // viaje-4/viaje-5, exclusivos del panel para mostrar mas variedad.
    expect(panel.viajesEnCurso).toHaveLength(5);
    expect(panel.notificaciones).toHaveLength(2);

    // Y los tres estados de Fresco siguen representados en el dataset.
    expect(panel.viajesEnCurso.map((viaje) => viaje.eta.estado)).toStrictEqual([
      'presente',
      'ausente-por-degradacion',
      'sin-dato',
      'presente',
      'presente',
    ]);
  });
});

describe('parsePanel · forma invalida', () => {
  it('rechaza un payload que no es objeto', () => {
    expect(() => parsePanel('no soy un objeto')).toThrow(PanelPayloadError);
  });

  it('rechaza un estado de frescura desconocido en lugar de adivinar', () => {
    const wire = {
      ...panelWireCompleto,
      viajes_en_curso: [{ ...panelWireCompleto.viajes_en_curso[0], eta: { estado: 'quiza' } }],
    };

    expect(() => parsePanel(wire)).toThrow(PanelPayloadError);
  });

  it('rechaza un indicador que falta en lugar de inventar un cero', () => {
    const sinIndicador: Record<string, unknown> = { ...panelWireCompleto };
    delete sinIndicador['viajes_activos'];

    expect(() => parsePanel(sinIndicador)).toThrow(PanelPayloadError);
  });

  it('rechaza un viaje en curso sin folio en lugar de omitir la fila', () => {
    const primerViaje: Record<string, unknown> = { ...panelWireCompleto.viajes_en_curso[0] };
    delete primerViaje['folio'];
    const wire = { ...panelWireCompleto, viajes_en_curso: [primerViaje] };

    expect(() => parsePanel(wire)).toThrow(PanelPayloadError);
  });
});
