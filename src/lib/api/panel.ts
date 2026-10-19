/*
 * El panel de control, contra `bff`.
 *
 * Un solo GET agregado en lugar de cuatro peticiones desde el navegador: los
 * indicadores, los viajes en curso y las notificaciones vienen de servicios distintos
 * aguas abajo, y componerlos es precisamente el trabajo de bff (P1). Si esta funcion
 * creciera hasta hacer varias llamadas y sumarlas aqui, la composicion se habria
 * mudado al cliente.
 *
 * El alcance —que viajes, de que tenant— lo deriva bff del claim del token. Aqui no
 * se manda ningun identificador de cliente, y si algun dia aparece uno es un bug de
 * seguridad, no una feature (P9, P10).
 */

import { api } from './client';
import type { PanelDeControl } from '../contracts';
import { parsePanel } from '../panel/parsePanel';

export async function getPanel(signal?: AbortSignal): Promise<PanelDeControl> {
  const raw = await api.get<unknown>('/panel', signal !== undefined ? { signal } : {});
  return parsePanel(raw);
}
