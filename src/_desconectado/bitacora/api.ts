/*
 * getBitacora — DESCONECTADO (recorte al contrato, E8-T3).
 *
 * El contrato `bff` no define `GET /viajes/{id}/bitacora`. Se conserva aquí, con su
 * tipo local, para reconectar cuando el contrato la publique (entonces el tipo pasa
 * a ser el generado y la función vuelve a `src/lib/api/viajes.ts`).
 */

import { api } from '@/lib/api/client';
import type { EntradaBitacora } from './BitacoraSection';

export async function getBitacora(
  viajeId: string,
  signal?: AbortSignal,
): Promise<readonly EntradaBitacora[]> {
  return api.get<readonly EntradaBitacora[]>(
    `/viajes/${viajeId}/bitacora`,
    signal !== undefined ? { signal } : {},
  );
}
