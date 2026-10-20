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
import type { DatosCarga, OpcionCatalogo } from './tipos';
import { Checkbox, FormField, Input, Select, Textarea } from '@ai27-tech/ui';
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
  const setCarga = (field: keyof Omit<DatosCarga, 'requisitos'>, value: string): void => {
    dispatch({ tipo: 'carga', campo: field, valor: value });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <SeccionCard
          title="Información de la Carga"
          icon={<Boxes aria-hidden="true" className="size-5" />}
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Categoría de la carga">
                <Select
                  options={categorias.map((option) => ({
                    value: option.id,
                    label: option.nombre,
                  }))}
                  placeholder="Seleccione una categoría"
                  value={carga.categoria}
                  onChange={(event) => setCarga('categoria', event.target.value)}
                />
              </FormField>
              <FormField label="Valor estimado (MXN)">
                <Select
                  options={rangosValor.map((option) => ({
                    value: option.id,
                    label: option.nombre,
                  }))}
                  placeholder="Seleccione un rango"
                  value={carga.valorEstimado}
                  onChange={(event) => setCarga('valorEstimado', event.target.value)}
                />
              </FormField>
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
                    onChange={(event) =>
                      dispatch({
                        tipo: 'carga-requisito',
                        codigo: requisito.id,
                        activo: event.target.checked,
                      })
                    }
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </SeccionCard>

        <SeccionCard
          title="Unidad y Operación"
          icon={<Truck aria-hidden="true" className="size-5" />}
        >
          <div className="flex flex-col gap-4">
            <FormField label="Requerimientos del vehículo/unidad">
              <Input
                value={carga.requerimientosVehiculo}
                onChange={(event) => setCarga('requerimientosVehiculo', event.target.value)}
                placeholder="Ej. Caja seca 53 pies, termo, rabón…"
              />
            </FormField>
            <FormField label="Instrucciones operativas adicionales">
              <Textarea
                value={carga.instruccionesOperativas}
                onChange={(event) => setCarga('instruccionesOperativas', event.target.value)}
                placeholder="Detalle cualquier instrucción específica para paradas, rutas alternas o requerimientos del operador…"
              />
            </FormField>
          </div>
        </SeccionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <DocumentacionCard
          comentarios={documentacionComentarios}
          onComentarios={(value) =>
            dispatch({ tipo: 'documentacion', campo: 'comentarios', valor: value })
          }
        />
        <PrivacidadCard />
      </div>
    </div>
  );
}
