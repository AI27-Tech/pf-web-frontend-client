/*
 * DestinosIntermedios — lista ordenable de destinos entre el origen y el destino final
 * (E1-HU-001, E9-T4).
 *
 * Los destinos intermedios se numeran por su POSICIÓN ("Destino 1", "Destino 2", …), así
 * que al reordenar se renumeran. El destino final no es parte de esta lista: se captura
 * aparte en `NuevaSolicitudForm` y siempre cierra la ruta.
 *
 * Reordenar:
 *   - Con el puntero: se arrastra el control de la izquierda de cada destino y se suelta
 *     sobre otro; el destino arrastrado ocupa la posición del destino sobre el que cae.
 *     Es arrastrar y soltar nativo del navegador (sin librería). Solo el control es
 *     arrastrable, no la tarjeta, para no romper la selección de texto en los campos.
 *   - Con el teclado: con el control enfocado, las flechas ↑ y ↓ mueven el destino una
 *     posición. El arrastre nativo no funciona con teclado ni en pantallas táctiles.
 */

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { GripVertical, MapPin } from 'lucide-react';
import { Button, FormField, Input } from '@ai27-tech/ui';
import type { DestinoIntermedio } from './ordenDestinos';

interface DestinosIntermediosProps {
  readonly destinos: readonly DestinoIntermedio[];
  /** Cambia el nombre del destino de la posición `indice`. */
  readonly onActualizar: (indice: number, nombre: string) => void;
  readonly onQuitar: (indice: number) => void;
  readonly onMover: (desde: number, hasta: number) => void;
}

const ICONO_UBICACION = <MapPin aria-hidden="true" className="size-4" />;
const ID_AYUDA_ORDEN = 'ayuda-orden-destinos';

export function DestinosIntermedios({
  destinos,
  onActualizar,
  onQuitar,
  onMover,
}: DestinosIntermediosProps) {
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null);
  const [sobreId, setSobreId] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');
  // Destino cuyo control debe recuperar el foco tras un movimiento con teclado: al
  // reordenar, el navegador suelta el foco del nodo que React reubica.
  const focoPendiente = useRef<string | null>(null);

  useEffect(() => {
    if (focoPendiente.current === null) return;
    document.querySelector<HTMLElement>(`[data-control-orden="${focoPendiente.current}"]`)?.focus();
    focoPendiente.current = null;
  }, [destinos]);

  function terminarArrastre(): void {
    setArrastrandoId(null);
    setSobreId(null);
  }

  function alSoltar(evento: DragEvent<HTMLDivElement>, hasta: number): void {
    evento.preventDefault();
    const desde = destinos.findIndex((d) => d.id === arrastrandoId);
    terminarArrastre();
    if (desde === -1 || desde === hasta) return;
    onMover(desde, hasta);
    setAnuncio(`Destino movido a la posición ${hasta + 1} de ${destinos.length}.`);
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLSpanElement>, indice: number): void {
    const destino =
      evento.key === 'ArrowUp' ? indice - 1 : evento.key === 'ArrowDown' ? indice + 1 : null;
    if (destino === null) return;
    evento.preventDefault();
    if (destino < 0 || destino >= destinos.length) return;
    const actual = destinos[indice];
    if (actual === undefined) return;
    focoPendiente.current = actual.id;
    onMover(indice, destino);
    setAnuncio(`Destino movido a la posición ${destino + 1} de ${destinos.length}.`);
  }

  const reordenable = destinos.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        {anuncio}
      </p>

      {destinos.map((destino, indice) => {
        const numero = indice + 1;
        const arrastrado = arrastrandoId === destino.id;
        const objetivo = sobreId === destino.id && arrastrandoId !== null && !arrastrado;
        return (
          <div
            key={destino.id}
            data-destino={destino.id}
            onDragOver={(evento) => {
              if (arrastrandoId === null) return;
              evento.preventDefault();
              evento.dataTransfer.dropEffect = 'move';
              if (sobreId !== destino.id) setSobreId(destino.id);
            }}
            onDrop={(evento) => alSoltar(evento, indice)}
            className={
              'border-outline-variant relative flex gap-3 rounded border p-4 transition-opacity ' +
              (arrastrado ? 'opacity-50 ' : '') +
              (objetivo ? 'ring-primary ring-2' : '')
            }
          >
            {reordenable && (
              <span
                role="button"
                tabIndex={0}
                draggable
                data-control-orden={destino.id}
                aria-label={`Reordenar destino ${numero}`}
                aria-describedby={ID_AYUDA_ORDEN}
                onDragStart={(evento) => {
                  evento.dataTransfer.effectAllowed = 'move';
                  // Firefox no inicia el arrastre si no se escribe algún dato.
                  evento.dataTransfer.setData('text/plain', destino.id);
                  const tarjeta = evento.currentTarget.closest<HTMLElement>('[data-destino]');
                  if (tarjeta !== null) evento.dataTransfer.setDragImage(tarjeta, 16, 16);
                  setArrastrandoId(destino.id);
                }}
                onDragEnd={terminarArrastre}
                onKeyDown={(evento) => alPresionarTecla(evento, indice)}
                className="text-on-surface-variant hover:text-on-surface focus-visible:outline-primary mt-8 flex h-9 shrink-0 cursor-grab items-center rounded focus-visible:outline-2 active:cursor-grabbing"
              >
                <GripVertical aria-hidden="true" className="size-5" />
              </span>
            )}

            {/* El botón se superpone a la fila de la etiqueta, a la derecha. */}
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onQuitar(indice)}
                aria-label={`Quitar destino ${numero}`}
              >
                Quitar
              </Button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <FormField label={`Destino ${numero}`} required>
                <Input
                  value={destino.nombre}
                  onChange={(evento) => onActualizar(indice, evento.target.value)}
                  placeholder="Ciudad o sitio del destino"
                  startAdornment={ICONO_UBICACION}
                  required
                />
              </FormField>
            </div>
          </div>
        );
      })}
    </div>
  );
}
