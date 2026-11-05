/*
 * Tipos del prototipo V2 de "Viajes Activos" (NO productivo).
 *
 * Cuando el seguimiento en vivo se retiró del release path de V1 (E9-T10 / F-06), los
 * campos de telemetría dejaron de vivir en el contrato del panel (`src/lib/contracts/
 * panel.ts`), porque V1 no los muestra y nada en `src/` los consume. Se conservan aquí,
 * en el prototipo, como la forma que esta superficie necesitaba.
 *
 * `ViajeEnCurso` de V1 solo tiene las columnas que la tabla del panel pinta
 * (`folio`, `origen`, `destino`, `estado`, `condicionesActivas`, `eta`). Este tipo lo
 * amplía con lo que solo el seguimiento vivo usaba: operador, progreso, estado de
 * seguimiento autorado y las tres lecturas de telemetría.
 *
 * NOTA: este archivo no se compila ni se enruta. Para revivir V2 habrá que confirmar
 * estos campos contra el contrato de `bff`/`realtime` de ese momento, no reconectarlos
 * tal cual.
 */

/** El `Fresco<Eta>` de V1 (src/lib/contracts). Se replica aquí para no depender de él. */
interface EtaValor {
  readonly objetivo: string;
  readonly estimadoEn: string;
}
type FrescoEta =
  | { readonly estado: 'presente'; readonly valor: EtaValor }
  | { readonly estado: 'ausente-por-degradacion' }
  | { readonly estado: 'sin-dato' };

interface CondicionActiva {
  readonly codigo: string;
  readonly descripcion: string;
  readonly desde: string;
}

/**
 * Estado de seguimiento de un viaje, con su etiqueta, tono e icono autorados en el wire
 * ("Ruta Segura", "Desvío Detectado", "En Tránsito"). Uniones abiertas: un valor que la
 * UI no reconoce cae en neutro.
 */
export interface EstadoSeguimiento {
  readonly etiqueta: string;
  readonly tono: 'success' | 'warning' | 'info' | (string & {});
  readonly icono: 'ruta-segura' | 'desvio-detectado' | 'en-transito' | (string & {});
}

/** El viaje en curso tal como lo pintaba la tarjeta de "Viajes Activos" del seguimiento. */
export interface ViajeEnCurso {
  readonly viajeId: string;
  readonly folio: string;
  readonly origen: string;
  readonly destino: string;
  readonly estado: string;
  readonly condicionesActivas: readonly CondicionActiva[];
  readonly eta: FrescoEta;
  readonly operadorNombre: string;
  readonly progresoPct: number;
  readonly estadoSeguimiento: EstadoSeguimiento;
  readonly velocidadPromedioKmh: number;
  readonly temperaturaCargaC: number;
  readonly bateriaGpsPct: number;
}
