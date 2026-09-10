/*
 * Modal propio, sobre <dialog> nativo.
 *
 * Nota sobre la restriccion "sin librerias de componentes": este es el punto donde
 * mas cuesta. Un overlay accesible a mano necesita foco atrapado, cierre con Escape,
 * restauracion del foco al cerrar y aislamiento del contenido de fondo. `<dialog>`
 * con `showModal()` da las cuatro cosas de forma nativa, y por eso se usa en lugar
 * de un <div> con position:fixed.
 *
 * Si mas adelante hacen falta overlays compuestos —combobox, menu, popover con
 * posicionamiento— conviene revisar la restriccion antes de acumular deuda de
 * accesibilidad. Reimplementar un focus manager no es trabajo de producto.
 */

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      // Cierra al pulsar el backdrop, pero no al pulsar dentro del panel.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-lg bg-white p-0 backdrop:bg-slate-900/40"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id="modal-title" className="text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
