/*
 * Dataset de los mocks, en FORMA DE CONTRATO ("wire"), no en forma de app.
 *
 * Esta es la decision que hace que estos mocks valgan algo: devuelven `snake_case` y
 * los envoltorios de frescura tal como los espera `parseTrackingPayload`, asi que la
 * app corre su parser de verdad. Si los mocks devolvieran `TrackingPayload` ya
 * construido, saltarian la unica pieza que de verdad hay que ejercitar y solo
 * probariamos que React renderiza objetos.
 *
 * Cuando exista contracts/openapi/bff.yaml, estos ejemplos son lo primero que hay que
 * validar contra el: si el contrato real usa otros nombres de campo, estos mocks
 * fallan y el parser tambien — que es exactamente la senal que se quiere.
 *
 * Los tres viajes cubren a proposito los tres estados de `Fresco<T>`:
 *   viaje-1  posicion y ETA presentes        -> el camino feliz, y el que recibe push
 *   viaje-2  ausente por degradacion         -> `procesamiento` caido, payload marcado
 *   viaje-3  sin dato                        -> recien solicitado, nunca hubo posicion
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

export const viajesWire = [
  {
    id: 'viaje-1',
    folio: 'AI27-000101',
    estado: 'EN_RUTA',
    origen: 'CDMX · Vallejo',
    destino: 'Queretaro · Parque Industrial',
    solicitadoEn: '2026-09-07T08:15:00Z',
  },
  {
    id: 'viaje-2',
    folio: 'AI27-000102',
    estado: 'EN_RUTA',
    origen: 'Guadalajara · El Salto',
    destino: 'Leon · Zona Franca',
    solicitadoEn: '2026-09-07T06:40:00Z',
  },
  {
    id: 'viaje-3',
    folio: 'AI27-000103',
    estado: 'SOLICITADO',
    origen: 'Monterrey · Apodaca',
    destino: 'Saltillo · Derramadero',
    solicitadoEn: '2026-09-07T15:05:00Z',
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
};

/** Payload de tracking en forma de contrato. Lo consumen la ruta pull Y el stream. */
export function trackingWire(viajeId: string, secuenciaDominio: number): Json {
  if (viajeId === 'viaje-2') {
    /*
     * El caso que mas importa demostrar: `procesamiento` no responde, asi que bff
     * sirve el payload PARCIAL Y MARCADO. Estado si, posicion y ETA ausentes con
     * marca explicita — no como null, no como cero, no interpolado.
     */
    return {
      viaje_id: viajeId,
      estado: 'EN_RUTA',
      condiciones_activas: [
        {
          codigo: 'SIN_SENAL',
          descripcion: 'Sin senal del dispositivo',
          desde: '2026-09-07T14:20:00Z',
        },
      ],
      posicion: {
        estado: 'ausente_por_degradacion',
        motivo: 'procesamiento no disponible',
        ultimo_dato_en: '2026-09-07T14:20:00Z',
      },
      eta: {
        estado: 'ausente_por_degradacion',
        motivo: 'procesamiento no disponible',
        ultimo_dato_en: null,
      },
      geocercas: [],
      secuencia_dominio: secuenciaDominio,
    };
  }

  if (viajeId === 'viaje-3') {
    // Recien solicitado: nunca hubo posicion. Distinto de no poder alcanzarla.
    return {
      viaje_id: viajeId,
      estado: 'SOLICITADO',
      condiciones_activas: [],
      posicion: null,
      eta: null,
      geocercas: [],
      secuencia_dominio: secuenciaDominio,
    };
  }

  // Camino feliz. La posicion avanza un poco con cada secuencia para que el push se vea.
  const deriva = secuenciaDominio * 0.002;

  return {
    viaje_id: viajeId,
    estado: 'EN_RUTA',
    condiciones_activas: [],
    posicion: {
      estado: 'presente',
      observado_en: new Date().toISOString(),
      valor: {
        lat: 19.9 + deriva,
        lon: -99.6 + deriva,
        rumbo: 315,
        velocidad_kmh: 84,
      },
    },
    eta: {
      estado: 'presente',
      observado_en: new Date().toISOString(),
      valor: { objetivo: 'destino', estimado_en: '2026-09-07T18:10:00Z' },
    },
    geocercas: [
      {
        id: 'geo-1',
        zona: 'Patio Vallejo',
        tipo: 'salida',
        ocurrio_en: '2026-09-07T09:02:00Z',
      },
    ],
    secuencia_dominio: secuenciaDominio,
  };
}

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
 *   viaje-2  ETA ausente por degradacion -> coherente con su tracking degradado
 *   viaje-3  sin ETA                     -> recien solicitado, nunca hubo
 *
 * Que `viaje-2` no traiga ETA no es una omision: si el panel le pintara una hora
 * concreta, el dataset se contradiria consigo mismo — la ruta de tracking de ese
 * mismo viaje declara que `procesamiento` esta caido.
 *
 * `viaje-4` y `viaje-5` se añaden solo aqui, exclusivos del panel, para mostrar mas
 * variedad de datos sin inventar tracking ni bitacora que no existen en el resto del
 * dataset. Ver el comentario junto a `viajes_en_curso` para el detalle de cada uno.
 *
 * Los numeros de los indicadores (24 viajes activos, 98%, 2 alertas) son los del
 * diseno y NO se derivan de `viajesWire`: son agregados de toda la cuenta, no de los
 * tres viajes de ejemplo.
 */
export function panelWire(): Json {
  const ahora = Date.now();
  const haceMinutos = (minutos: number): string => new Date(ahora - minutos * 60_000).toISOString();

  /** Hoy a una hora concreta, en la zona del navegador. */
  const hoyALas = (hora: number, minuto: number): string => {
    const fecha = new Date(ahora);
    fecha.setHours(hora, minuto, 0, 0);
    return fecha.toISOString();
  };

  /** Manana a una hora concreta. Ejercita la rama "Mañana" de `formatEtaTexto`. */
  const mananaALas = (hora: number, minuto: number): string => {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + 1);
    fecha.setHours(hora, minuto, 0, 0);
    return fecha.toISOString();
  };

  /** Dentro de `dias` dias. Ejercita la rama de fecha completa de `formatEtaTexto`. */
  const enDiasALas = (dias: number, hora: number, minuto: number): string => {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + dias);
    fecha.setHours(hora, minuto, 0, 0);
    return fecha.toISOString();
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
          observado_en: haceMinutos(1),
          valor: { objetivo: 'destino', estimado_en: hoyALas(18, 30) },
        },
        operador_nombre: 'Carlos R.',
        progreso_pct: 65,
        estado_seguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' },
        velocidad_promedio_kmh: 78,
        temperatura_carga_c: -4,
        bateria_gps_pct: 92,
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
            desde: haceMinutos(95),
          },
        ],
        eta: {
          estado: 'ausente_por_degradacion',
          motivo: 'procesamiento no disponible',
          ultimo_dato_en: haceMinutos(95),
        },
        operador_nombre: 'Miguel S.',
        progreso_pct: 42,
        estado_seguimiento: {
          etiqueta: 'Desvío Detectado',
          tono: 'warning',
          icono: 'desvio-detectado',
        },
        velocidad_promedio_kmh: 64,
        temperatura_carga_c: 3,
        bateria_gps_pct: 78,
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
        operador_nombre: 'Ana G.',
        progreso_pct: 10,
        estado_seguimiento: { etiqueta: 'En Tránsito', tono: 'info', icono: 'en-transito' },
        velocidad_promedio_kmh: 58,
        temperatura_carga_c: 5,
        bateria_gps_pct: 85,
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
          observado_en: haceMinutos(3),
          valor: { objetivo: 'destino', estimado_en: mananaALas(10, 15) },
        },
        operador_nombre: 'Luis P.',
        progreso_pct: 30,
        estado_seguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' },
        velocidad_promedio_kmh: 82,
        temperatura_carga_c: -2,
        bateria_gps_pct: 88,
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
          observado_en: haceMinutos(4),
          valor: { objetivo: 'destino', estimado_en: enDiasALas(5, 18, 30) },
        },
        operador_nombre: 'Sofia T.',
        progreso_pct: 88,
        estado_seguimiento: { etiqueta: 'En Tránsito', tono: 'info', icono: 'en-transito' },
        velocidad_promedio_kmh: 45,
        temperatura_carga_c: 6,
        bateria_gps_pct: 67,
      },
    ],
    notificaciones: [
      {
        id: 'notif-1',
        severidad: 'critica',
        titulo: 'Desvío de ruta detectado',
        cuerpo: `La unidad del viaje ${viajesWire[1].folio} salió de la geocerca en un tramo peligroso.`,
        ocurrio_en: haceMinutos(2),
      },
      {
        id: 'notif-2',
        severidad: 'informativa',
        // Folio historico a proposito: un viaje ya cerrado no puede aparecer en la
        // lista de viajes en curso, y asi el dataset no se contradice.
        titulo: 'Llegada a destino',
        cuerpo: 'El viaje AI27-000098 se completó con exito en CEDIS Norte.',
        ocurrio_en: haceMinutos(45),
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
  'tipos-servicio': [
    { id: 'ts-1', nombre: 'Custodia armada' },
    { id: 'ts-2', nombre: 'Monitoreo simple' },
  ],
};
