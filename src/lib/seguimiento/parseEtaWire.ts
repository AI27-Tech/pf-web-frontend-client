/*
 * Parsers de valor del seguimiento que V1 SI necesita: el ETA y las condiciones
 * activas. Son puros (sin fetch, sin estado, sin reloj, sin DOM) y los consume el
 * parser del panel (`lib/panel/parsePanel.ts`), que pinta el ETA estimado y las
 * condiciones de cada viaje en curso.
 *
 * Viven aqui, separados del payload de seguimiento V2 (posicion, geocercas, senal,
 * stream), porque ese payload quedo aislado del release path de V1 (E9-T10 / F-06) en
 * `prototipos-v2/seguimiento-vivo/`. El ETA y las condiciones no son telemetria: son
 * las dos piezas del seguimiento que V1 muestra, asi que se quedan en `src/`.
 *
 * Una sola implementacion por forma: si el panel y el (futuro) seguimiento V1
 * necesitan leer el mismo campo, lo leen desde aqui en lugar de duplicar la lectura.
 */

import type { CondicionActiva } from '../contracts';
import type { Eta } from '../contracts';
import { isRecord, requireString } from '../wire/readers';

export function parseEtaWire(value: Record<string, unknown>): Eta {
  // TODO(ADR 4): cuando cierre la politica de colchon, revisar si cruzan dos
  // numeros de ETA en lugar de uno y si hay que distinguirlos aqui.
  return {
    objetivo: requireString(value, 'objetivo'),
    estimadoEn: requireString(value, 'estimado_en'),
  };
}

/** Las condiciones activas se superponen al estado de progreso (§C.2). */
export function parseCondicionesWire(raw: unknown): readonly CondicionActiva[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(isRecord).map((item) => ({
    codigo: requireString(item, 'codigo'),
    descripcion: requireString(item, 'descripcion'),
    desde: requireString(item, 'desde'),
  }));
}
