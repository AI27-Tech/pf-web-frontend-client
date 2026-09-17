/*
 * Pie de navegacion del asistente para los pasos 1-3: "Regresar" (a la izquierda,
 * oculto en el primer paso) y "Continuar" (a la derecha). El paso "Revisar" tiene su
 * propio pie porque incluye la casilla de confirmacion y "Enviar solicitud".
 *
 * Sin "Guardar borrador" a proposito: el borrador se conserva entre pasos en memoria y
 * solo se envia al final.
 */

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@ai27-tech/ui';

interface WizardFooterProps {
  /** Si se omite, no se muestra "Regresar" (primer paso). */
  readonly onRegresar?: () => void;
  readonly onContinuar: () => void;
}

export function WizardFooter({ onRegresar, onContinuar }: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {onRegresar !== undefined ? (
        <Button
          variant="secondary"
          onClick={onRegresar}
          startIcon={<ArrowLeft aria-hidden="true" className="size-4" />}
        >
          Regresar
        </Button>
      ) : (
        <span />
      )}
      <Button
        variant="primary"
        onClick={onContinuar}
        endIcon={<ArrowRight aria-hidden="true" className="size-4" />}
      >
        Continuar
      </Button>
    </div>
  );
}
