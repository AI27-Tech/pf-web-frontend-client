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

export const DEV_USER = {
  usuario: 'cliente@demo.ai27',
  password: 'demo1234',
} as const;

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
 * El listado de viajes.
 *
 * TODO(contracts): confirmar nombres de campo (`origenSitio`, `unidad`,
 * `reporteSeguridad`, ...) contra contracts/openapi/bff.yaml cuando exista.
 */
export const viajesWire = [
  {
    id: 'viaje-1',
    folio: 'AI27-000101',
    estado: 'EN_RUTA',
    origen: 'CDMX · Vallejo',
    destino: 'Queretaro · Parque Industrial',
    solicitadoEn: '2026-09-07T08:15:00Z',
    origenSitio: 'Almacen Central',
    destinoSitio: 'Planta Industrial Sur',
    unidad: { descripcion: 'Volvo FH16', placa: 'AB-123', conductorNombre: 'Juan Perez' },
    reporteSeguridad: 'SIN_INCIDENCIAS',
  },
  {
    id: 'viaje-2',
    folio: 'AI27-000102',
    estado: 'EN_RUTA',
    origen: 'Guadalajara · El Salto',
    destino: 'Leon · Zona Franca',
    solicitadoEn: '2026-09-07T06:40:00Z',
    origenSitio: 'Centro Logistico',
    destinoSitio: 'Parque Industrial',
    unidad: { descripcion: 'Kenworth T680', placa: 'CD-456', conductorNombre: 'Miguel Silva' },
    reporteSeguridad: 'CON_INCIDENCIAS',
  },
  {
    id: 'viaje-3',
    folio: 'AI27-000103',
    estado: 'SOLICITADO',
    origen: 'Monterrey · Apodaca',
    destino: 'Saltillo · Derramadero',
    solicitadoEn: '2026-09-07T15:05:00Z',
    origenSitio: 'Patio de Origen',
    destinoSitio: 'Derramadero',
    // Recien solicitado: aun no hay unidad asignada. La celda dira "Sin asignar".
    unidad: null,
    reporteSeguridad: 'PENDIENTE',
  },
  {
    id: 'viaje-6',
    folio: 'AI27-000106',
    estado: 'COMPLETADO',
    origen: 'Puebla · Parque Vw',
    destino: 'Veracruz · Puerto Nuevo',
    solicitadoEn: '2026-09-05T06:00:00Z',
    origenSitio: 'Planta Vw',
    destinoSitio: 'Puerto Nuevo',
    unidad: {
      descripcion: 'Freightliner Cascadia',
      placa: 'EF-789',
      conductorNombre: 'Carlos Gomez',
    },
    reporteSeguridad: 'SIN_INCIDENCIAS',
  },
  {
    id: 'viaje-7',
    folio: 'AI27-000107',
    estado: 'CANCELADO',
    origen: 'Tijuana · Otay',
    destino: 'Mexicali · Ejido Nuevo Leon',
    solicitadoEn: '2026-09-04T09:30:00Z',
    origenSitio: 'Otay Industrial',
    destinoSitio: 'Ejido Nuevo Leon',
    unidad: { descripcion: 'Scania R450', placa: 'GH-012', conductorNombre: 'Laura Mendez' },
    reporteSeguridad: 'CON_INCIDENCIAS',
  },
  {
    id: 'viaje-8',
    folio: 'AI27-000108',
    estado: 'COMPLETADO',
    origen: 'CDMX · Iztapalapa',
    destino: 'Toluca · Lerma',
    solicitadoEn: '2026-09-03T11:20:00Z',
    origenSitio: 'CEDIS Oriente',
    destinoSitio: 'Zona Industrial Lerma',
    unidad: { descripcion: 'International LT', placa: 'IJ-345', conductorNombre: 'Roberto Diaz' },
    reporteSeguridad: 'SIN_INCIDENCIAS',
  },
] as const;

export const viajeDetalleWire: Record<string, Json> = {
  'viaje-1': {
    ...viajesWire[0],
    condicionesActivas: [],
    contratoId: 'contrato-77',
    rutaId: 'ruta-12',
  },
  'viaje-2': {
    ...viajesWire[1],
    condicionesActivas: [
      {
        codigo: 'SIN_SENAL',
        descripcion: 'Sin senal del dispositivo',
        desde: '2026-09-07T14:20:00Z',
      },
    ],
    contratoId: 'contrato-77',
    rutaId: 'ruta-31',
  },
  'viaje-3': {
    ...viajesWire[2],
    condicionesActivas: [],
    contratoId: 'contrato-90',
    rutaId: null,
  },
  'viaje-6': {
    ...viajesWire[3],
    condicionesActivas: [],
    contratoId: 'contrato-45',
    rutaId: 'ruta-58',
  },
  'viaje-7': {
    ...viajesWire[4],
    condicionesActivas: [],
    contratoId: 'contrato-62',
    rutaId: 'ruta-71',
  },
  'viaje-8': {
    ...viajesWire[5],
    condicionesActivas: [],
    contratoId: 'contrato-83',
    rutaId: 'ruta-19',
  },
};

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
        folio: viajesWire[0].folio,
        origen: viajesWire[0].origen,
        destino: viajesWire[0].destino,
        estado: viajesWire[0].estado,
        condiciones_activas: [],
        eta: {
          estado: 'presente',
          observado_en: minutesAgo(1),
          valor: { objetivo: 'destino', estimado_en: todayAt(18, 30) },
        },
      },
      {
        viaje_id: 'viaje-2',
        folio: viajesWire[1].folio,
        origen: viajesWire[1].origen,
        destino: viajesWire[1].destino,
        estado: viajesWire[1].estado,
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
        folio: viajesWire[2].folio,
        origen: viajesWire[2].origen,
        destino: viajesWire[2].destino,
        estado: viajesWire[2].estado,
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
        cuerpo: `La unidad del viaje ${viajesWire[1].folio} salió de la geocerca en un tramo peligroso.`,
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
