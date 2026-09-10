/*
 * Notificaciones y placeholder del mapa.
 *
 * El test central es el de la severidad: tiene que distinguirse por algo mas que el
 * color. Si alguien sustituye el icono y el texto oculto por un simple cambio de
 * fondo, esta prueba falla — que es exactamente lo que se quiere, porque el color se
 * pierde en escala de grises y para una parte de la poblacion.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { NotificacionPanel } from '@/lib/contracts';
import { NotificacionesCard } from '@/features/panel/NotificacionesCard';
import { MapPlaceholderCard } from '@/features/panel/MapPlaceholderCard';

const haceMinutos = (minutos: number): string =>
  new Date(Date.now() - minutos * 60_000).toISOString();

const notificaciones: readonly NotificacionPanel[] = [
  {
    id: 'notif-1',
    severidad: 'critica',
    titulo: 'Desvio de ruta detectado',
    cuerpo: 'La unidad del viaje AI27-000102 salio de la geocerca.',
    ocurrioEn: haceMinutos(2),
  },
  {
    id: 'notif-2',
    severidad: 'informativa',
    titulo: 'Llegada a destino',
    cuerpo: 'El viaje AI27-000098 se completo con exito.',
    ocurrioEn: haceMinutos(45),
  },
];

describe('NotificacionesCard', () => {
  it('es una lista de verdad, para que se anuncie cuantos avisos hay', () => {
    render(<NotificacionesCard notificaciones={notificaciones} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('la severidad se anuncia como texto, no solo como color', () => {
    render(<NotificacionesCard notificaciones={notificaciones} />);

    // El texto es accesible aunque este visualmente oculto: es la unica forma de que
    // "critica" llegue a quien no ve el rojo.
    expect(screen.getByText('Critica:')).toBeInTheDocument();
    expect(screen.getByText('Informativa:')).toBeInTheDocument();
  });

  it('el tiempo se muestra relativo pero conserva el instante exacto', () => {
    render(<NotificacionesCard notificaciones={notificaciones} />);

    const marca = screen.getByText('hace 2 minutos');
    expect(marca.tagName).toBe('TIME');
    expect(marca).toHaveAttribute('dateTime', notificaciones[0]?.ocurrioEn);
    // Y la fecha legible completa sigue disponible.
    expect(marca).toHaveAttribute('title');
  });

  it('una severidad desconocida se pinta en neutro en lugar de fingir que no es grave', () => {
    render(
      <NotificacionesCard
        notificaciones={[
          {
            id: 'notif-9',
            severidad: 'urgentisima',
            titulo: 'Severidad nueva',
            cuerpo: 'Un codigo que el cliente no conoce todavia.',
            ocurrioEn: haceMinutos(5),
          },
        ]}
      />,
    );

    expect(screen.getByText('Aviso:')).toBeInTheDocument();
    const item = screen.getByRole('listitem');
    // Ni rojo ni azul: no nos toca decidir por el backend si algo es grave.
    expect(item.className).toContain('bg-surface-container');
    expect(item.className).not.toContain('bg-error-container');
  });

  it('sin notificaciones lo dice en lugar de dejar la tarjeta muda', () => {
    render(<NotificacionesCard notificaciones={[]} />);

    expect(screen.getByText('No hay notificaciones recientes.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('MapPlaceholderCard', () => {
  it('el hueco se explica con palabras y el icono no se anuncia', () => {
    render(<MapPlaceholderCard />);

    // Un icono solo seria un cuadro vacio para un lector de pantalla.
    expect(screen.getByText(/La vista de mapa todavia no esta disponible/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Vista de mapa' })).toBeInTheDocument();
  });
});
