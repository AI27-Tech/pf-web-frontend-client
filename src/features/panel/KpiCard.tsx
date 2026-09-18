/*
 * Una tarjeta de indicador del panel.
 *
 * Presentacional puro: recibe lo que tiene que pintar y no sabe de donde sale. El
 * `value` es un ReactNode y no un string porque los tres indicadores del diseno no
 * tienen la misma forma —un numero grande, un texto en dos lineas, un contador de
 * alertas— y forzarlos a un tipo comun obligaria a que la tarjeta interpretara el
 * dato. Aqui no se interpreta nada: se pinta.
 *
 * El icono va con `aria-hidden` en quien lo pasa. Es decorativo: la etiqueta ya dice
 * de que indicador se trata, asi que anunciarlo dos veces solo estorba a un lector de
 * pantalla.
 */

import type { ReactNode } from 'react';
import { Card, CardBody } from '@ai27-tech/ui';
import { cx } from '@/lib/utils';

/** Tono del valor y del pie. El fondo de la tarjeta no cambia: la jerarquia la da el dato. */
type KpiTone = 'neutral' | 'primary' | 'success' | 'error';

interface KpiCardProps {
  readonly label: string;
  readonly value: ReactNode;
  /** Linea inferior: contexto del indicador */
  readonly footer?: ReactNode;
  readonly icon?: ReactNode;
  readonly tone?: KpiTone;
}

const valueTone: Record<KpiTone, string> = {
  neutral: 'text-on-surface',
  primary: 'text-primary',
  success: 'text-on-success-container',
  error: 'text-error',
};

const footerTone: Record<KpiTone, string> = {
  neutral: 'text-on-surface-variant',
  primary: 'text-on-surface-variant',
  success: 'text-on-success-container',
  error: 'text-error',
};

const iconTone: Record<KpiTone, string> = {
  neutral: 'text-on-surface-variant',
  primary: 'text-primary',
  success: 'text-success',
  error: 'text-error',
};

export function KpiCard({ label, value, footer, icon, tone = 'neutral' }: KpiCardProps) {
  return (
    // El contenido va en `CardBody`: es el subcomponente que consume `--card-pad`, la
    // variable que la prop `padding` del `Card` define. Sin el, el padding no aplica.
    <Card variant="outlined" padding="md" className="h-full">
      {/* `CardBody` reduce su `padding-top` porque asume un `CardHeader` encima; aqui va
          solo, asi que se restablece al valor de `--card-pad` para que quede simetrico. */}
      <CardBody className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">
            {label}
          </p>
          {icon !== undefined && <span className={cx('shrink-0', iconTone[tone])}>{icon}</span>}
        </div>

        <p className={cx('text-3xl leading-tight font-bold', valueTone[tone])}>{value}</p>

        {footer !== undefined && (
          <p className={cx('mt-auto flex items-center gap-1 text-xs', footerTone[tone])}>
            {footer}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
