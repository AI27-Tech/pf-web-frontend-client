/*
 * useBreadcrumbLinks: arma los elementos del `Breadcrumb` de `@ai27-tech/ui` que navegan
 * dentro de la app.
 */

import type { MouseEvent } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import type { BreadcrumbItemData } from '@ai27-tech/ui';
import type { EstadoViaje } from '@/lib/contracts';
import { conservarFiltro } from '@/features/viajes/filtroEstado';

function esClicNormal(evento: MouseEvent): boolean {
  return (
    evento.button === 0 && !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey
  );
}

export function useBreadcrumbLinks() {
  const router = useRouter();
  const navigate = useNavigate();

  function historial(estado?: EstadoViaje): BreadcrumbItemData {
    const search = conservarFiltro(estado);
    return {
      label: 'Historial de Viajes',
      href: router.buildLocation({ to: '/viajes', search }).href,
      onClick: (evento) => {
        if (!esClicNormal(evento)) return;
        evento.preventDefault();
        void navigate({ to: '/viajes', search });
      },
    };
  }

  return { historial };
}
