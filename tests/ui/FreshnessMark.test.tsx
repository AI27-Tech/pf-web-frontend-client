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

interface Valor {
  readonly texto: string;
}

const render1 = (valor: Valor) => <span>{valor.texto}</span>;

describe('FreshnessMark', () => {
  it('pinta el dato cuando esta presente y es reciente', () => {
    render(
      <FreshnessMark
        dato={presente<Valor>({ texto: '19.4326, -99.1332' }, new Date().toISOString())}
        etiqueta="posicion"
        render={render1}
      />,
    );

    expect(screen.getByText('19.4326, -99.1332')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('marca la ausencia por degradacion en lugar de callarla', () => {
    render(
      <FreshnessMark
        dato={ausentePorDegradacion<Valor>('procesamiento no disponible', '2026-09-07T14:30:00Z')}
        etiqueta="posicion"
        render={render1}
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
    render(<FreshnessMark dato={sinDato<Valor>()} etiqueta="posicion" render={render1} />);

    expect(screen.getByText(/Sin posicion registrada/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('etiqueta un dato presente pero viejo', () => {
    const hace5Minutos = new Date(Date.now() - 5 * 60_000).toISOString();

    render(
      <FreshnessMark
        dato={presente<Valor>({ texto: 'dato viejo' }, hace5Minutos)}
        etiqueta="posicion"
        umbralAntiguedadSeg={30}
        render={render1}
      />,
    );

    // Se muestra el dato Y se avisa de su edad: ni se oculta ni se presenta como fresco.
    expect(screen.getByText('dato viejo')).toBeInTheDocument();
    expect(screen.getByText(/puede no reflejar la situacion actual/i)).toBeInTheDocument();
  });
});
