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
  // Segundo factor (TOTP) del dev user. En el sistema real lo valida el IdP; el mock
  // solo exige un codigo conocido para reproducir el camino feliz y, por contraste,
  // el 401 uniforme ante un codigo ausente o incorrecto (DEC-094).
  segundoFactor: '123456',
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

/*
 * El listado de viajes, en la FORMA DE CONTRATO `ViajeResumen` ({id, estado, origen}).
 * Los estados son los del enum del contrato (ADR 19). Los campos que el portal
 * mostraba antes (folio, destino, unidad, reporteSeguridad, fecha) se retiraron: el
 * contrato no los define. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 *
 * 15 viajes. Cubren 12 de los 13 estados del ciclo de vida, para ver cada chip y cada combinación de
 * acciones del cliente.
 */
export const viajesWire = [
  { id: 'viaje-1', estado: 'EN_TRANSITO', origen: 'CDMX · Vallejo' },
  { id: 'viaje-2', estado: 'EN_TRANSITO', origen: 'Guadalajara · El Salto' },
  { id: 'viaje-3', estado: 'SOLICITADO', origen: 'Monterrey · Apodaca' },
  { id: 'viaje-4', estado: 'APROBADO', origen: 'Querétaro · Parque Industrial Benito Juárez' },
  { id: 'viaje-5', estado: 'ASIGNADO', origen: 'Veracruz · Puerto de Veracruz' },
  { id: 'viaje-6', estado: 'CERRADO', origen: 'Puebla · Parque Vw' },
  { id: 'viaje-7', estado: 'CANCELADO', origen: 'Tijuana · Otay' },
  { id: 'viaje-8', estado: 'CERRADO', origen: 'CDMX · Iztapalapa' },
  { id: 'viaje-9', estado: 'EN_TRANSITO', origen: 'Saltillo · Ramos Arizpe' },
  { id: 'viaje-10', estado: 'EN_DESTINO', origen: 'Mérida · Umán' },
  { id: 'viaje-11', estado: 'APTO_PARA_SALIDA', origen: 'Toluca · Lerma' },
  { id: 'viaje-12', estado: 'EN_EMBARQUE', origen: 'León · Silao' },
  { id: 'viaje-13', estado: 'PATRULLA_EN_CAMINO', origen: 'Hermosillo · Planta Ford' },
  { id: 'viaje-14', estado: 'EN_DESCARGA', origen: 'Tampico · Altamira' },
  { id: 'viaje-15', estado: 'RECHAZADO_POR_CLIENTE', origen: 'Cancún · Zona Hotelera' },
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
  // viaje-9 y viaje-10 tienen detalles con incidencias variadas (E9-T6) y ahora también
  // aparecen en el historial.
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

  // --- Una situación por estado del ciclo de vida -------------------------------------
  // Las categorías de incidencia son las cinco CURADAS (DEC-006); nunca el tipo interno.

  // viaje-4: APROBADO. Aún sin ETA. El cliente puede CANCELAR pero no rechazar.
  'viaje-4': {
    id: 'viaje-4',
    hito: { estado: 'APROBADO', etiqueta: 'Servicio aprobado' },
    eta: null,
    incidencias: [],
  },
  // viaje-5: ASIGNADO, con ETA vigente. El cliente puede CANCELAR y RECHAZAR.
  'viaje-5': {
    id: 'viaje-5',
    hito: { estado: 'ASIGNADO', etiqueta: 'Unidad asignada' },
    eta: { valor: '2026-11-12T16:00:00Z', obsoleto: false },
    incidencias: [],
  },
  // viaje-6: CERRADO, con una incidencia ya RESUELTA en su historia y su impacto en el ETA.
  'viaje-6': {
    id: 'viaje-6',
    hito: { estado: 'CERRADO', etiqueta: 'Servicio concluido' },
    eta: null,
    incidencias: [
      {
        categoria: 'Retraso/desvío en ruta',
        estado: 'resuelta',
        marca_tiempo: '2026-09-05T11:30:00Z',
        impacto_eta: '+20 min',
      },
    ],
  },
  // viaje-7: CANCELADO (terminal), sin ETA ni incidencias.
  'viaje-7': {
    id: 'viaje-7',
    hito: { estado: 'CANCELADO', etiqueta: 'Cancelado' },
    eta: null,
    incidencias: [],
  },
  // viaje-8: CERRADO con DOS incidencias resueltas.
  'viaje-8': {
    id: 'viaje-8',
    hito: { estado: 'CERRADO', etiqueta: 'Servicio concluido' },
    eta: null,
    incidencias: [
      {
        categoria: 'Pérdida de contacto',
        estado: 'resuelta',
        marca_tiempo: '2026-10-02T08:40:00Z',
      },
      {
        categoria: 'Falla mecánica/de equipo',
        estado: 'resuelta',
        marca_tiempo: '2026-10-02T10:05:00Z',
        impacto_eta: '+1 h',
      },
    ],
  },
  // viaje-11: APTO_PARA_SALIDA. El cliente puede CANCELAR y RECHAZAR.
  'viaje-11': {
    id: 'viaje-11',
    hito: { estado: 'APTO_PARA_SALIDA', etiqueta: 'Apto para salida' },
    eta: { valor: '2026-11-11T14:00:00Z', obsoleto: false },
    incidencias: [],
  },
  // viaje-12: EN_EMBARQUE. Ya no se puede cancelar: el viaje está en marcha.
  'viaje-12': {
    id: 'viaje-12',
    hito: { estado: 'EN_EMBARQUE', etiqueta: 'Cargando en origen' },
    eta: { valor: '2026-11-11T22:30:00Z', obsoleto: false },
    incidencias: [],
  },
  // viaje-13: PATRULLA_EN_CAMINO, todavía sin ETA calculado.
  'viaje-13': {
    id: 'viaje-13',
    hito: { estado: 'PATRULLA_EN_CAMINO', etiqueta: 'Patrulla en camino al punto de encuentro' },
    eta: null,
    incidencias: [],
  },
  // viaje-14: EN_DESCARGA con una incidencia EN ATENCIÓN que movió el ETA (ya obsoleto).
  'viaje-14': {
    id: 'viaje-14',
    hito: { estado: 'EN_DESCARGA', etiqueta: 'Descargando en destino' },
    eta: { valor: '2026-11-09T21:00:00Z', obsoleto: true },
    incidencias: [
      {
        categoria: 'Falla mecánica/de equipo',
        estado: 'en_atencion',
        marca_tiempo: '2026-11-09T20:10:00Z',
        impacto_eta: '+1 h',
      },
    ],
  },
  // viaje-15: RECHAZADO_POR_CLIENTE (terminal).
  'viaje-15': {
    id: 'viaje-15',
    hito: { estado: 'RECHAZADO_POR_CLIENTE', etiqueta: 'Rechazado' },
    eta: null,
    incidencias: [],
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

/*
 * Conversación del viaje, en FORMA DE CONTRATO (E9-T8 / E3-HU-014, ADR audiencia Cliente).
 *
 * El modelo V1 es UNA conversación POR VIAJE (anclada al viaje, no a un `conversacion_id`),
 * así que el estado del mock se indexa por `viajeId`. La vista del cliente es mínima:
 * `{ viaje_id, estado, atendida }` para la metadata y `{ id, secuencia, cuerpo, enviado_en,
 * de_cliente }` por mensaje. Nunca hay `actor_real`, rol interno, bandeja ni pool: el
 * `bff` recorta eso aguas arriba, así que el mock simplemente no lo tiene.
 *
 * `secuencia` es la secuencia DE DOMINIO. Los mensajes seed salen a propósito en un orden
 * distinto al de su secuencia, para que se vea que la app ordena por dominio y no por el
 * orden en que llegan.
 */
export interface ConversacionWireMock {
  readonly viaje_id: string;
  estado: 'abierta' | 'solo_lectura' | 'cerrada';
  atendida: boolean;
}

export interface MensajeClienteWireMock {
  readonly id: string;
  /** Secuencia DE DOMINIO, asignada por el servidor. */
  readonly secuencia: number;
  readonly cuerpo: string;
  readonly enviado_en: string;
  readonly de_cliente: boolean;
  /** Clave de idempotencia del envío; NO se expone al cliente, es base del mock. */
  readonly client_message_id?: string;
}

export const conversacionesWire: Record<string, ConversacionWireMock> = {
  // viaje-1: abierta y atendida, con historial. Camino feliz.
  'viaje-1': { viaje_id: 'viaje-1', estado: 'abierta', atendida: true },
  // viaje-2: abierta, aún no atendida.
  'viaje-2': { viaje_id: 'viaje-2', estado: 'abierta', atendida: false },
  // viaje-6: cerrada (viaje terminal) → solo lectura: el envío responde 409.
  'viaje-6': { viaje_id: 'viaje-6', estado: 'solo_lectura', atendida: true },
  // viaje-4: abierta, aún sin mensajes ("Sin mensajes todavía") y sin atender.
  'viaje-4': { viaje_id: 'viaje-4', estado: 'abierta', atendida: false },
  // viaje-5: abierta; el cliente escribió y nadie ha respondido todavía.
  'viaje-5': { viaje_id: 'viaje-5', estado: 'abierta', atendida: false },
  // viaje-7: estado `cerrada` (no `solo_lectura`): la razón del compositor es otra.
  'viaje-7': { viaje_id: 'viaje-7', estado: 'cerrada', atendida: true },
  // viaje-9: abierta, sin atender, con mensajes muy largos (desborde y saltos de línea).
  'viaje-9': { viaje_id: 'viaje-9', estado: 'abierta', atendida: false },
  // viaje-10: abierta y atendida, con historial corto.
  'viaje-10': { viaje_id: 'viaje-10', estado: 'abierta', atendida: true },
  // viaje-14: abierta con 60 mensajes: pasa del límite de 50 y ofrece "Cargar anteriores".
  'viaje-14': { viaje_id: 'viaje-14', estado: 'abierta', atendida: true },
  // viaje-15: solo lectura (viaje terminal).
  'viaje-15': { viaje_id: 'viaje-15', estado: 'solo_lectura', atendida: true },
  // viaje-3, 8, 11, 12 y 13 NO tienen conversación: el bff responde 404.
};

/**
 * `total` mensajes alternados cliente / AI27, uno cada 5 minutos, con secuencia de dominio
 * 1..N. Sirve para probar la historia paginada hacia atrás (más de 50 mensajes).
 */
function mensajesAlternados(prefijo: string, total: number): MensajeClienteWireMock[] {
  const inicio = Date.UTC(2026, 10, 9, 8, 0, 0);
  return Array.from({ length: total }, (_, i) => {
    const deCliente = i % 2 === 0;
    const turno = Math.floor(i / 2) + 1;
    return {
      id: `${prefijo}-${i + 1}`,
      secuencia: i + 1,
      cuerpo: deCliente
        ? `Consulta ${turno}: ¿cómo va la descarga de la unidad?`
        : `Respuesta ${turno}: la descarga sigue en curso, te avisamos al terminar.`,
      enviado_en: new Date(inicio + i * 5 * 60_000).toISOString(),
      de_cliente: deCliente,
    };
  });
}

export const mensajesWire: Record<string, MensajeClienteWireMock[]> = {
  'viaje-1': [
    {
      id: 'm-3',
      secuencia: 3,
      cuerpo: 'Confirmado, la unidad sale en cuanto liberen.',
      enviado_en: '2026-09-07T13:40:00Z',
      de_cliente: false,
    },
    {
      id: 'm-1',
      secuencia: 1,
      cuerpo: '¿Buenas, la unidad sigue detenida en aduana?',
      enviado_en: '2026-09-07T13:05:00Z',
      de_cliente: true,
    },
    {
      id: 'm-2',
      secuencia: 2,
      cuerpo: 'Sí, estamos esperando la liberación documental.',
      enviado_en: '2026-09-07T13:22:00Z',
      de_cliente: false,
    },
  ],
  'viaje-2': [
    {
      id: 'm-4',
      secuencia: 1,
      cuerpo: '¿Podemos mover la entrega a las 18:00?',
      enviado_en: '2026-09-07T11:10:00Z',
      de_cliente: true,
    },
  ],
  'viaje-6': [
    {
      id: 'm-5',
      secuencia: 1,
      cuerpo: 'El viaje se cerró con éxito. Gracias.',
      enviado_en: '2026-09-05T18:00:00Z',
      de_cliente: false,
    },
  ],
  // viaje-4: sin mensajes (la clave existe para dejar claro que la lista está vacía).
  'viaje-4': [],
  // viaje-5: un mensaje del cliente sin respuesta.
  'viaje-5': [
    {
      id: 'm-6',
      secuencia: 1,
      cuerpo: 'Quedo atento a la confirmación de la unidad y del operador.',
      enviado_en: '2026-11-09T17:20:00Z',
      de_cliente: true,
    },
  ],
  // viaje-7: conversación `cerrada` tras la cancelación.
  'viaje-7': [
    {
      id: 'm-7',
      secuencia: 1,
      cuerpo: 'Cancelamos el servicio por cambio en la fecha de embarque.',
      enviado_en: '2026-10-28T10:00:00Z',
      de_cliente: true,
    },
    {
      id: 'm-8',
      secuencia: 2,
      cuerpo: 'Recibido, el servicio quedó cancelado.',
      enviado_en: '2026-10-28T10:12:00Z',
      de_cliente: false,
    },
  ],
  // viaje-9: mensajes largos. El primero es un párrafo con saltos de línea; el segundo trae
  // una URL larguísima SIN espacios, que es lo que más fácil desborda una burbuja.
  'viaje-9': [
    {
      id: 'm-9',
      secuencia: 1,
      cuerpo:
        'Buenas tardes. Les escribo para informar que el operador reportó una demora en la caseta de peaje y que el cliente final pidió adelantar la ventana de entrega.\n\nPor favor confirmen si la patrulla puede acompañar a la unidad hasta el almacén de destino y si hace falta algún trámite adicional en la aduana interior antes de las 18:00 horas de hoy.',
      enviado_en: '2026-11-09T14:05:00Z',
      de_cliente: true,
    },
    {
      id: 'm-10',
      secuencia: 2,
      cuerpo:
        'Recibido. Aquí está el comprobante: https://ejemplo.ai27.test/comprobantes/2026/11/09/viaje-9/verificacion-de-ruta-y-ventana-de-entrega-0123456789abcdefghijklmnopqrstuvwxyz',
      enviado_en: '2026-11-09T14:20:00Z',
      de_cliente: false,
    },
  ],
  // viaje-10: historial corto, atendido.
  'viaje-10': [
    {
      id: 'm-11',
      secuencia: 1,
      cuerpo: '¿A qué hora llega la unidad al almacén?',
      enviado_en: '2026-10-23T10:00:00Z',
      de_cliente: true,
    },
    {
      id: 'm-12',
      secuencia: 2,
      cuerpo: 'Estimamos las 12:00, con el retraso ya contemplado.',
      enviado_en: '2026-10-23T10:08:00Z',
      de_cliente: false,
    },
  ],
  // viaje-14: 60 mensajes (más del límite de 50 de una página).
  'viaje-14': mensajesAlternados('m14', 60),
  // viaje-15: conversación de un viaje rechazado, en solo lectura.
  'viaje-15': [
    {
      id: 'm-13',
      secuencia: 1,
      cuerpo: 'No aceptamos la unidad asignada; solicitamos otra.',
      enviado_en: '2026-11-02T09:30:00Z',
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

/*
 * Emergencias del cliente, en FORMA DE CONTRATO (E9-T9, ADR 21 §6).
 *
 * viaje-2 arranca con un caso `en_atencion` para cubrir "emergencia activa" y "un solo
 * caso" por URL directa. Otros tres cubren más situaciones:
 *   viaje-9   dos casos (uno resuelto y otro en atención): aparece el selector de caso
 *   viaje-10  un caso ya resuelto: hay historia pero NO hay emergencia activa
 *   viaje-13  un caso recién `abierta`, todavía sin atender
 * El resto de viajes arranca sin emergencias.
 */
export interface CasoEmergenciaWireMock {
  readonly id: string;
  estado: 'abierta' | 'en_atencion' | 'resuelta';
  readonly activada_en: string;
  /** Las notas NO se exponen al cliente; se guardan para que el mock no las pierda. */
  readonly notas: string[];
  /** `activacion_id` que creó el caso: base de la idempotencia del mock. */
  readonly activacion_id: string;
}

export const emergenciasWire: Record<string, CasoEmergenciaWireMock[]> = {
  'viaje-2': [
    {
      id: 'emg-seed-1',
      estado: 'en_atencion',
      activada_en: '2026-10-23T14:05:00Z',
      notas: [],
      activacion_id: 'seed-activacion-1',
    },
  ],
  'viaje-9': [
    {
      id: 'emg-seed-9a',
      estado: 'resuelta',
      activada_en: '2026-11-09T12:40:00Z',
      notas: [],
      activacion_id: 'seed-activacion-9a',
    },
    {
      id: 'emg-seed-9b',
      estado: 'en_atencion',
      activada_en: '2026-11-09T15:10:00Z',
      notas: [],
      activacion_id: 'seed-activacion-9b',
    },
  ],
  'viaje-10': [
    {
      id: 'emg-seed-10',
      estado: 'resuelta',
      activada_en: '2026-10-23T08:50:00Z',
      notas: [],
      activacion_id: 'seed-activacion-10',
    },
  ],
  'viaje-13': [
    {
      id: 'emg-seed-13',
      estado: 'abierta',
      activada_en: '2026-11-10T13:25:00Z',
      notas: [],
      activacion_id: 'seed-activacion-13',
    },
  ],
};

/*
 * Tipos de servicio en la forma de `TipoServicioCliente` (`codigo` + `etiqueta`), la única
 * familia de catálogo que el `bff` sirve al cliente en V1 (E9-T4). El handler los pagina
 * de dos en dos para que el portal tenga que seguir `cursor_siguiente`, como contra el
 * `bff` real.
 */
export const tiposServicioWire: readonly components['schemas']['TipoServicioCliente'][] = [
  { codigo: 'monitoreo-activo', etiqueta: 'Monitoreo Activo' },
  { codigo: 'custodia-armada', etiqueta: 'Custodia Armada' },
  { codigo: 'localizacion-gps', etiqueta: 'Localización GPS' },
];
