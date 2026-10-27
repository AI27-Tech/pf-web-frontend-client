/*
 * Dataset de los mocks, en FORMA DE CONTRATO ("wire"), no en forma de app.
 *
 * Esta es la decision que hace que estos mocks valgan algo: devuelven `snake_case` y
 * los envoltorios de frescura tal como los esperan los parsers de la app (p. ej. el
 * del panel), asi que la app corre su parser de verdad. Si los mocks devolvieran los
 * modelos ya construidos, saltarian la unica pieza que de verdad hay que ejercitar y
 * solo probariamos que React renderiza objetos.
 *
 * Cuando exista contracts/openapi/bff.yaml, estos ejemplos son lo primero que hay que
 * validar contra el: si el contrato real usa otros nombres de campo, estos mocks
 * fallan y el parser tambien — que es exactamente la senal que se quiere.
 *
 * El ETA del panel cubre a proposito los tres estados de `Fresco<Eta>`:
 *   viaje-1  ETA presente                 -> el camino feliz
 *   viaje-2  ausente por degradacion      -> `procesamiento` caido, ETA marcado
 *   viaje-3  sin dato                      -> recien solicitado, nunca hubo ETA
 *
 * El seguimiento vivo (posicion, geocercas, senal, stream) era V2 y se retiro del
 * release path de V1 (E9-T10 / F-06); su dataset de mentira vive ahora en
 * `prototipos-v2/seguimiento-vivo/`.
 */

import type { components } from '@ai27-tech/contracts/openapi/bff';

export const DEV_USER = {
  usuario: 'cliente@demo.ai27',
  contrasena: 'demo1234',
} as const;

/**
 * Respuesta de sesion en FORMA DE CONTRATO. Tipada contra el `Sesion` generado del
 * tracer: si el contrato renombra o quita un campo, este builder deja de compilar.
 * Es la pieza que ata el mock al contrato (contract test en tests/contracts/sesion).
 */
export function sesionWire(): components['schemas']['Sesion'] {
  return {
    sesion_id: 'ses-mock-1',
    access_token: 'mock.jwt.no-firmado',
    refresh_token: 'mock.refresh-1',
    // Vida corta a propósito: hace visible el bucle de refresco de SessionContext.
    expira_en: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

/** Valor JSON. Los mocks devuelven JSON crudo, no modelos de la app. */
export type Json = string | number | boolean | null | Json[] | { readonly [key: string]: Json };

/** Mensaje en forma de contrato. Tipado porque el handler de envio calcula su `seq`. */
export interface MensajeWireMock {
  readonly id: string;
  /** Secuencia DE DOMINIO, asignada por el servidor. */
  readonly seq: number;
  readonly cuerpo: string;
  readonly enviado_en: string;
  readonly de_cliente: boolean;
}

/*
 * El listado de viajes, en la FORMA DE CONTRATO `ViajeResumen` ({id, estado, origen}).
 * Los estados son los del enum del contrato (ADR 19). Los campos que el portal
 * mostraba antes (folio, destino, unidad, reporteSeguridad, fecha) se retiraron: el
 * contrato no los define. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
export const viajesWire = [
  { id: 'viaje-1', estado: 'EN_TRANSITO', origen: 'CDMX · Vallejo' },
  { id: 'viaje-2', estado: 'EN_TRANSITO', origen: 'Guadalajara · El Salto' },
  { id: 'viaje-3', estado: 'SOLICITADO', origen: 'Monterrey · Apodaca' },
  { id: 'viaje-6', estado: 'CERRADO', origen: 'Puebla · Parque Vw' },
  { id: 'viaje-7', estado: 'CANCELADO', origen: 'Tijuana · Otay' },
  { id: 'viaje-8', estado: 'CERRADO', origen: 'CDMX · Iztapalapa' },
] as const;

export const viajeDetalleWire: Record<string, Json> = {
  // Forma de contrato `ViajeSeguimiento`: {id, hito, eta, incidencias}. Vista curada
  // del cliente (DEC-006): sin folio/origen/destino ni tipo interno de incidencia.
  'viaje-1': {
    id: 'viaje-1',
    hito: { estado: 'EN_TRANSITO', etiqueta: 'En tránsito a destino' },
    eta: { valor: '2026-09-07T18:30:00Z', obsoleto: false },
    incidencias: [],
  },
  'viaje-2': {
    id: 'viaje-2',
    hito: { estado: 'EN_TRANSITO', etiqueta: 'En tránsito a destino' },
    eta: { valor: '2026-09-07T16:00:00Z', obsoleto: true },
    incidencias: [
      {
        categoria: 'Incidencia de seguridad',
        estado: 'en_atencion',
        marca_tiempo: '2026-09-07T14:20:00Z',
      },
    ],
  },
  'viaje-3': {
    id: 'viaje-3',
    hito: { estado: 'SOLICITADO', etiqueta: 'Servicio solicitado' },
    eta: null,
    incidencias: [],
  },
  // viaje-9 y viaje-10 son SOLO de detalle (no están en `viajesWire`, así que no
  // aparecen en el historial ni alteran su paginación): se alcanzan por URL directa
  // (/viajes/viaje-9, /viajes/viaje-10) para la prueba manual de E9-T6.
  //
  // viaje-9: VARIAS incidencias, incluyendo una RESUELTA y una con IMPACTO EN EL ETA.
  // Cubre de un tiro tres de los cinco estados del ticket E9-T6. Las categorías son
  // las cinco CURADAS (DEC-006); nunca el tipo interno. `impacto_eta` es opcional en
  // el contrato: el portal lo pinta solo cuando viene (aquí, "+45 min").
  'viaje-9': {
    id: 'viaje-9',
    hito: { estado: 'EN_TRANSITO', etiqueta: 'En tránsito a destino' },
    eta: { valor: '2026-10-23T20:00:00Z', obsoleto: false },
    incidencias: [
      {
        categoria: 'Retraso/desvío en ruta',
        estado: 'en_atencion',
        marca_tiempo: '2026-10-23T15:30:00Z',
        impacto_eta: '+45 min',
      },
      {
        categoria: 'Falla mecánica/de equipo',
        estado: 'resuelta',
        marca_tiempo: '2026-10-23T16:00:00Z',
      },
      {
        categoria: 'Pérdida de contacto',
        estado: 'en_atencion',
        marca_tiempo: '2026-10-23T17:10:00Z',
      },
    ],
  },
  // viaje-10: UNA sola incidencia RESUELTA, sin impacto en el ETA. Aísla el caso
  // "resuelta" (y confirma que sin `impacto_eta` no se pinta la línea de impacto).
  'viaje-10': {
    id: 'viaje-10',
    hito: { estado: 'EN_DESTINO', etiqueta: 'En destino' },
    eta: { valor: '2026-10-23T12:00:00Z', obsoleto: true },
    incidencias: [
      {
        categoria: 'Accidente/percance',
        estado: 'resuelta',
        marca_tiempo: '2026-10-23T09:15:00Z',
      },
    ],
  },
};

/*
 * `bitacoraWire` — DESCONECTADO (recorte al contrato): su handler se retiró porque el
 * contrato bff no define la bitácora. El dato se conserva para cuando se reconecte el
 * componente de src/_desconectado/bitacora/. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
export const bitacoraWire: Record<string, Json> = {
  'viaje-1': [
    { id: 'b-1', ocurrioEn: '2026-09-07T08:15:00Z', descripcion: 'Servicio solicitado' },
    { id: 'b-2', ocurrioEn: '2026-09-07T08:52:00Z', descripcion: 'Unidad asignada' },
    { id: 'b-3', ocurrioEn: '2026-09-07T09:02:00Z', descripcion: 'Salida del patio de origen' },
  ],
  'viaje-2': [
    { id: 'b-4', ocurrioEn: '2026-09-07T06:40:00Z', descripcion: 'Servicio solicitado' },
    { id: 'b-5', ocurrioEn: '2026-09-07T14:20:00Z', descripcion: 'Sin senal del dispositivo' },
  ],
  'viaje-3': [{ id: 'b-6', ocurrioEn: '2026-09-07T15:05:00Z', descripcion: 'Servicio solicitado' }],
};

export const conversacionesWire = [
  {
    id: 'conv-1',
    asunto: 'Demora en aduana · AI27-000101',
    viajeId: 'viaje-1',
    ultimoMensajeEn: '2026-09-07T13:40:00Z',
    noLeidos: 2,
  },
  {
    id: 'conv-2',
    asunto: 'Cambio de ventana de entrega',
    viajeId: 'viaje-2',
    ultimoMensajeEn: '2026-09-07T11:10:00Z',
    noLeidos: 0,
  },
] as const;

/*
 * `seq` aqui es la secuencia DE DOMINIO. Los mensajes salen a proposito en un orden
 * distinto al de su secuencia, para que se vea que la app ordena por dominio y no por
 * el orden en que llegan.
 */
export const mensajesWire: Record<string, MensajeWireMock[]> = {
  'conv-1': [
    {
      id: 'm-3',
      seq: 3,
      cuerpo: 'Confirmado, la unidad sale en cuanto liberen.',
      enviado_en: '2026-09-07T13:40:00Z',
      de_cliente: false,
    },
    {
      id: 'm-1',
      seq: 1,
      cuerpo: 'Buenas, la unidad sigue detenida en aduana?',
      enviado_en: '2026-09-07T13:05:00Z',
      de_cliente: true,
    },
    {
      id: 'm-2',
      seq: 2,
      cuerpo: 'Si, estamos esperando la liberacion documental.',
      enviado_en: '2026-09-07T13:22:00Z',
      de_cliente: false,
    },
  ],
  'conv-2': [
    {
      id: 'm-4',
      seq: 1,
      cuerpo: 'Podemos mover la entrega a las 18:00?',
      enviado_en: '2026-09-07T11:10:00Z',
      de_cliente: true,
    },
  ],
};

/*
 * El panel de control, en forma de contrato.
 *
 * Es una FUNCION y no una constante porque el panel muestra tiempos relativos ("Hoy,
 * 18:30", "hace 2 minutos"): con marcas fijas, la pantalla envejeceria sola y a los
 * dos dias mostraria un ETA en el pasado. Las marcas se calculan al servir.
 *
 * Las tres primeras filas son los MISMOS `viaje-1/2/3` del resto del dataset, con sus
 * mismos folios, y su ETA cubre los tres estados de `Fresco`:
 *   viaje-1  ETA presente                -> camino feliz
 *   viaje-2  ETA ausente por degradacion -> coherente con su seguimiento degradado
 *   viaje-3  sin ETA                     -> recien solicitado, nunca hubo
 *
 * Que `viaje-2` no traiga ETA no es una omision: si el panel le pintara una hora
 * concreta, el dataset se contradiria consigo mismo — la ruta de seguimiento de ese
 * mismo viaje declara que `procesamiento` esta caido.
 *
 * `viaje-4` y `viaje-5` se añaden solo aqui, exclusivos del panel, para mostrar mas
 * variedad de datos sin inventar seguimiento ni bitacora que no existen en el resto del
 * dataset. Ver el comentario junto a `viajes_en_curso` para el detalle de cada uno.
 *
 * Los numeros de los indicadores (24 viajes activos, 98%, 2 alertas) son los del
 * diseno y NO se derivan de `viajesWire`: son agregados de toda la cuenta, no de los
 * tres viajes de ejemplo.
 */
/*
 * `panelWire` — DESCONECTADO (recorte al contrato): su handler GET /api/v1/panel se
 * retiró porque el contrato bff no lo define. Se conserva para cuando se reconecte el
 * panel de src/_desconectado/panel/. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
export function panelWire(): Json {
  const now = Date.now();
  const minutesAgo = (minutes: number): string => new Date(now - minutes * 60_000).toISOString();

  /** Hoy a una hora concreta, en la zona del navegador. */
  const todayAt = (hour: number, minute: number): string => {
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  /** Manana a una hora concreta. Ejercita la rama "Mañana" de `formatEtaText`. */
  const tomorrowAt = (hour: number, minute: number): string => {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  /** Dentro de N dias. Ejercita la rama de fecha completa de `formatEtaText`. */
  const inDaysAt = (days: number, hour: number, minute: number): string => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  return {
    viajes_activos: { total: 24, delta_desde_ayer: 3 },
    riesgo_global: { nivel: 'BAJO_NORMAL', unidades_seguras_pct: 98 },
    alertas_activas: { total: 2 },
    viajes_en_curso: [
      {
        viaje_id: 'viaje-1',
        folio: 'AI27-000101',
        origen: 'CDMX · Vallejo',
        destino: 'Queretaro · Parque Industrial',
        estado: 'EN_TRANSITO',
        condiciones_activas: [],
        eta: {
          estado: 'presente',
          observado_en: minutesAgo(1),
          valor: { objetivo: 'destino', estimado_en: todayAt(18, 30) },
        },
      },
      {
        viaje_id: 'viaje-2',
        folio: 'AI27-000102',
        origen: 'Guadalajara · El Salto',
        destino: 'Leon · Zona Franca',
        estado: 'EN_TRANSITO',
        condiciones_activas: [
          {
            codigo: 'RETRASADO',
            descripcion: 'Retrasado',
            desde: minutesAgo(95),
          },
        ],
        eta: {
          estado: 'ausente_por_degradacion',
          motivo: 'procesamiento no disponible',
          ultimo_dato_en: minutesAgo(95),
        },
      },
      {
        viaje_id: 'viaje-3',
        folio: 'AI27-000103',
        origen: 'Monterrey · Apodaca',
        destino: 'Saltillo · Derramadero',
        estado: 'SOLICITADO',
        condiciones_activas: [],
        // Nunca hubo ETA. No es lo mismo que no poder calcularlo ahora.
        eta: null,
      },
      {
        viaje_id: 'viaje-4',
        folio: 'AI27-000104',
        origen: 'Tijuana · Otay Industrial',
        destino: 'Mexicali · Ejido Nuevo Leon',
        estado: 'EN_RUTA',
        condiciones_activas: [],
        eta: {
          estado: 'presente',
          observado_en: minutesAgo(3),
          valor: { objetivo: 'destino', estimado_en: tomorrowAt(10, 15) },
        },
      },
      {
        viaje_id: 'viaje-5',
        folio: 'AI27-000105',
        origen: 'Puebla · Angelopolis',
        destino: 'Veracruz · Puerto',
        // Codigo deliberadamente SIN mapear en `EstadoViajeChip`: es la demostracion
        // en vivo de que un estado desconocido se pinta tal cual, en neutro, en vez
        // de fingir una traduccion que el contrato no confirma.
        estado: 'EN_ADUANA',
        condiciones_activas: [],
        eta: {
          estado: 'presente',
          observado_en: minutesAgo(4),
          valor: { objetivo: 'destino', estimado_en: inDaysAt(5, 18, 30) },
        },
      },
    ],
    notificaciones: [
      {
        id: 'notif-1',
        severidad: 'critica',
        titulo: 'Desvío de ruta detectado',
        cuerpo: 'La unidad del viaje AI27-000102 salió de la geocerca en un tramo peligroso.',
        ocurrio_en: minutesAgo(2),
      },
      {
        id: 'notif-2',
        severidad: 'informativa',
        // Folio historico a proposito: un viaje ya cerrado no puede aparecer en la
        // lista de viajes en curso, y asi el dataset no se contradice.
        titulo: 'Llegada a destino',
        cuerpo: 'El viaje AI27-000098 se completó con exito en CEDIS Norte.',
        ocurrio_en: minutesAgo(45),
      },
    ],
  };
}

export const catalogosWire: Record<string, Json[]> = {
  rutas: [
    { id: 'ruta-12', nombre: 'CDMX - Queretaro' },
    { id: 'ruta-31', nombre: 'Guadalajara - Leon' },
  ],
  zonas: [
    { id: 'zona-1', nombre: 'Bajio' },
    { id: 'zona-2', nombre: 'Valle de Mexico' },
  ],
  /*
   * Los `id` son estables y en ingles (se mapean a iconos/descripciones en la feature);
   * el `nombre` es la etiqueta visible del diseno. Las descripciones y los iconos de las
   * tarjetas de tipo de servicio NO viven aqui.
   */
  'tipos-servicio': [
    { id: 'monitoreo-activo', nombre: 'Monitoreo Activo' },
    { id: 'custodia-armada', nombre: 'Custodia Armada' },
    { id: 'localizacion-gps', nombre: 'Localización GPS' },
  ],
  'prioridades-servicio': [
    { id: 'estandar', nombre: 'Estándar' },
    { id: 'alta', nombre: 'Alta' },
    { id: 'critica', nombre: 'Crítica' },
  ],
  'categorias-carga': [
    { id: 'electronicos', nombre: 'Electrónicos' },
    { id: 'perecederos', nombre: 'Perecederos' },
    { id: 'automotriz', nombre: 'Automotriz' },
    { id: 'farmaceuticos', nombre: 'Farmacéuticos' },
    { id: 'general', nombre: 'Carga general' },
  ],
  'rangos-valor': [
    { id: 'menos-500k', nombre: 'Menos de $500,000' },
    { id: '500k-2m', nombre: '$500,000 – $2,000,000' },
    { id: '2m-10m', nombre: '$2,000,000 – $10,000,000' },
    { id: 'mas-10m', nombre: 'Más de $10,000,000' },
  ],
  'requisitos-manejo': [
    { id: 'fragil', nombre: 'Frágil' },
    { id: 'temp-controlada', nombre: 'Temp. Controlada' },
    { id: 'mat-peligroso', nombre: 'Mat. Peligroso' },
    { id: 'alto-valor', nombre: 'Alto Valor' },
    { id: 'sobredimensionado', nombre: 'Sobredimensionado' },
  ],
};
