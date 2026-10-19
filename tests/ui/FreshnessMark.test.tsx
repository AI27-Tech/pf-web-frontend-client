/*
 * El componente que impide el "mapa que miente", probado en sus tres estados.
 *
 * El test que importa es el segundo: verifica que un dato ausente por degradacion se
 * RENDERIZA como tal, con su motivo y con el ultimo dato conocido etiquetado — en vez
 * de desaparecer en silencio como si nunca hubiera habido dato.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreshnessMark } from '@/components/ui/FreshnessMark';
import { ausentePorDegradacion, presente, sinDato } from '@/lib/contracts';

interface Value {
  readonly text: string;
}

const renderValue = (value: Value) => <span>{value.text}</span>;

describe('FreshnessMark', () => {
  it('pinta el dato cuando esta presente y es reciente', () => {
    render(
      <FreshnessMark
        data={presente<Value>({ text: '19.4326, -99.1332' }, new Date().toISOString())}
        label="posicion"
        render={renderValue}
      />,
    );

    expect(screen.getByText('19.4326, -99.1332')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('marca la ausencia por degradacion en lugar de callarla', () => {
    render(
      <FreshnessMark
        data={ausentePorDegradacion<Value>('procesamiento no disponible', '2026-09-07T14:30:00Z')}
        label="posicion"
        render={renderValue}
      />,
    );

    // La marca es un role=status: la ausencia se anuncia, no se deduce del vacio.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Sin posicion en este momento/i)).toBeInTheDocument();
    expect(screen.getByText(/procesamiento no disponible/i)).toBeInTheDocument();
    // El ultimo dato conocido aparece, y aparece etiquetado como no actualizado.
    expect(screen.getByText(/no actualizado/i)).toBeInTheDocument();
  });

  it('distingue "sin dato" de "degradado"', () => {
    render(<FreshnessMark data={sinDato<Value>()} label="posicion" render={renderValue} />);

    expect(screen.getByText(/Sin posicion registrada/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('etiqueta un dato presente pero viejo', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();

    render(
      <FreshnessMark
        data={presente<Value>({ text: 'dato viejo' }, fiveMinutesAgo)}
        label="posicion"
        staleThresholdSeconds={30}
        render={renderValue}
      />,
    );

    // Se muestra el dato Y se avisa de su edad: ni se oculta ni se presenta como fresco.
    expect(screen.getByText('dato viejo')).toBeInTheDocument();
    expect(screen.getByText(/puede no reflejar la situacion actual/i)).toBeInTheDocument();
  });
});
