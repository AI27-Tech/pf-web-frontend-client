/*
 * Paso 3 — Detalles.
 *
 * Dos columnas: a la izquierda "Información de la Carga" y "Unidad y Operación"; a la
 * derecha "Documentación" (sin subida) y el aviso de privacidad. Las categorias, los
 * rangos de valor y los requisitos de manejo salen de catalogo. Los requisitos son
 * casillas que despachan el toggle `carga-requisito`; el resto son campos de la carga.
 */

import type { Dispatch } from 'react';
import { Boxes, Truck } from 'lucide-react';
import type { DatosCarga, OpcionCatalogo } from '@/lib/contracts';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import type { AccionBorrador } from './borrador';
import { SeccionCard } from './SeccionCard';
import { DocumentacionCard } from './DocumentacionCard';
import { PrivacidadCard } from './PrivacidadCard';

interface PasoDetallesProps {
  readonly carga: DatosCarga;
  readonly documentacionComentarios: string;
  readonly categorias: readonly OpcionCatalogo[];
  readonly rangosValor: readonly OpcionCatalogo[];
  readonly requisitos: readonly OpcionCatalogo[];
  readonly dispatch: Dispatch<AccionBorrador>;
}

export function PasoDetalles({
  carga,
  documentacionComentarios,
  categorias,
  rangosValor,
  requisitos,
  dispatch,
}: PasoDetallesProps) {
  const setCarga = (campo: keyof Omit<DatosCarga, 'requisitos'>, valor: string): void => {
    dispatch({ tipo: 'carga', campo, valor });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <SeccionCard
          titulo="Información de la Carga"
          icono={<Boxes aria-hidden="true" className="size-5" />}
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Categoría de la carga"
                opciones={categorias.map((opcion) => ({ value: opcion.id, label: opcion.nombre }))}
                placeholder="Seleccione una categoría"
                value={carga.categoria}
                onChange={(evento) => setCarga('categoria', evento.target.value)}
              />
              <Select
                label="Valor estimado (MXN)"
                opciones={rangosValor.map((opcion) => ({ value: opcion.id, label: opcion.nombre }))}
                placeholder="Seleccione un rango"
                value={carga.valorEstimado}
                onChange={(evento) => setCarga('valorEstimado', evento.target.value)}
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-on-surface-variant mb-1 text-sm font-medium">
                Requisitos de manejo especial
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {requisitos.map((requisito) => (
                  <Checkbox
                    key={requisito.id}
                    label={requisito.nombre}
                    checked={carga.requisitos.includes(requisito.id)}
                    onChange={(evento) =>
                      dispatch({
                        tipo: 'carga-requisito',
                        codigo: requisito.id,
                        activo: evento.target.checked,
                      })
                    }
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </SeccionCard>

        <SeccionCard
          titulo="Unidad y Operación"
          icono={<Truck aria-hidden="true" className="size-5" />}
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Requerimientos del vehículo/unidad"
              value={carga.requerimientosVehiculo}
              onChange={(evento) => setCarga('requerimientosVehiculo', evento.target.value)}
              placeholder="Ej. Caja seca 53 pies, termo, rabón…"
            />
            <Textarea
              label="Instrucciones operativas adicionales"
              value={carga.instruccionesOperativas}
              onChange={(evento) => setCarga('instruccionesOperativas', evento.target.value)}
              placeholder="Detalle cualquier instrucción específica para paradas, rutas alternas o requerimientos del operador…"
            />
          </div>
        </SeccionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <DocumentacionCard
          comentarios={documentacionComentarios}
          onComentarios={(valor) =>
            dispatch({ tipo: 'documentacion', campo: 'comentarios', valor })
          }
        />
        <PrivacidadCard />
      </div>
    </div>
  );
}
