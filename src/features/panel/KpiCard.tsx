/*
 * Una tarjeta de indicador del panel.
 *
 * Presentacional puro: recibe lo que tiene que pintar y no sabe de donde sale. El
 * `valor` es un ReactNode y no un string porque los tres indicadores del diseno no
 * tienen la misma forma —un numero grande, un texto en dos lineas, un contador de
 * alertas— y forzarlos a un tipo comun obligaria a que la tarjeta interpretara el
 * dato. Aqui no se interpreta nada: se pinta.
 *
 * El icono va con `aria-hidden` en quien lo pasa. Es decorativo: la etiqueta ya dice
 * de que indicador se trata, asi que anunciarlo dos veces solo estorba a un lector de
 * pantalla.
 */

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cx } from '@/lib/utils';

/** Tono del valor y del pie. El fondo de la tarjeta no cambia: la jerarquia la da el dato. */
type TonoKpi = 'neutral' | 'primary' | 'success' | 'error';

interface KpiCardProps {
  readonly etiqueta: string;
  readonly valor: ReactNode;
  /** Linea inferior: contexto del indicador */
  readonly pie?: ReactNode;
  readonly icono?: ReactNode;
  readonly tono?: TonoKpi;
}

const valorTono: Record<TonoKpi, string> = {
  neutral: 'text-on-surface',
  primary: 'text-primary',
  success: 'text-on-success-container',
  error: 'text-error',
};

const pieTono: Record<TonoKpi, string> = {
  neutral: 'text-on-surface-variant',
  primary: 'text-on-surface-variant',
  success: 'text-on-success-container',
  error: 'text-error',
};

const iconoTono: Record<TonoKpi, string> = {
  neutral: 'text-on-surface-variant',
  primary: 'text-primary',
  success: 'text-success',
  error: 'text-error',
};

export function KpiCard({ etiqueta, valor, pie, icono, tono = 'neutral' }: KpiCardProps) {
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">
          {etiqueta}
        </p>
        {icono !== undefined && <span className={cx('shrink-0', iconoTono[tono])}>{icono}</span>}
      </div>

      <p className={cx('text-3xl leading-tight font-bold', valorTono[tono])}>{valor}</p>

      {pie !== undefined && (
        <p className={cx('mt-auto flex items-center gap-1 text-xs', pieTono[tono])}>{pie}</p>
      )}
    </Card>
  );
}
