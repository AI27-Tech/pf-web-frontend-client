import { Outlet } from '@tanstack/react-router';
import { useModal } from '@/context/ModalContext';
import { Modal } from '@/components/ui/Modal';
import { DegradationBanner } from './DegradationBanner';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const modal = useModal();

  return (
    <div className="flex min-h-dvh">
      <a
        href="#contenido"
        className="focus:bg-primary focus:text-on-primary sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <DegradationBanner />

        <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>

      <Modal open={modal.content !== null} title="Confirmar" onClose={modal.close}>
        {modal.content}
      </Modal>
    </div>
  );
}
