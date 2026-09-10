/*
 * Las dos acciones del panel, en la cuarta columna de la fila de indicadores.
 *
 * "Solicitar Servicio" es un `Link` y no un boton con `onClick`: es una navegacion,
 * asi que tiene que ser un enlace de verdad —abrible en pestana nueva, con destino
 * visible en la barra de estado— y no un boton que navega por JavaScript.
 *
 * "Descargar Reporte" no tiene funcionalidad definida todavia. Se deja visible y
 * operable pero sin handler, igual que el enlace de recuperacion de contrasena de
 * LoginSection: el diseno lo pide, el flujo no existe. No se deshabilita porque un
 * boton deshabilitado comunica "no puedes ahora", y lo cierto es "esto aun no se ha
 * construido".
 */

import { Link } from '@tanstack/react-router';
import { CirclePlus, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function QuickActionsCard() {
  return (
    <Card className="flex h-full flex-col gap-2 p-4" ariaLabel="Acciones rapidas">
      <Link
        to="/viajes/new"
        className="bg-primary text-on-primary hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-semibold transition-colors"
      >
        <CirclePlus aria-hidden="true" className="size-5 shrink-0" />
        Solicitar Servicio
      </Link>

      {/* TODO(producto): la generacion del reporte no esta definida. Sin handler. */}
      <Button variant="secondary" className="flex-1 gap-2 py-3">
        <FileText aria-hidden="true" className="size-5 shrink-0" />
        Descargar Reporte
      </Button>
    </Card>
  );
}
