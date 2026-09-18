/*
 * Fixtures del panel de control en su forma de contrato ("wire").
 *
 * PROVISIONAL: los nombres de campo son los que asume `src/lib/panel/parsePanel.ts`
 * y NO estan confirmados por contracts/openapi/bff.yaml — que no existe todavia.
 * Igual que en las fixtures de seguimiento, la documentacion fija el requisito de que la
 * ausencia por degradacion viaje marcada, no su serializacion.
 *
 * Los tres viajes en curso cubren a proposito los tres estados de `Fresco`:
 *   viaje-1  ETA presente               -> el camino feliz
 *   viaje-2  ETA ausente por degradacion -> `procesamiento` caido, marca explicita
 *   viaje-3  ETA nula                   -> recien solicitado, nunca hubo ETA
 *
 * TODO(contracts): sustituir por ejemplos tomados del contrato real.
 */

export const panelWireCompleto = {
  viajes_activos: { total: 24, delta_desde_ayer: 3 },
  riesgo_global: { nivel: 'BAJO_NORMAL', unidades_seguras_pct: 98 },
  alertas_activas: { total: 2 },
  viajes_en_curso: [
    {
      viaje_id: 'viaje-1',
      folio: 'AI27-000101',
      origen: 'CDMX · Vallejo',
      destino: 'Queretaro · Parque Industrial',
      estado: 'EN_RUTA',
      condiciones_activas: [],
      eta: {
        estado: 'presente',
        observado_en: '2026-09-09T12:00:00Z',
        valor: { objetivo: 'destino', estimado_en: '2026-09-09T18:30:00Z' },
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
      folio: 'AI27-000102',
      origen: 'Guadalajara · El Salto',
      destino: 'Leon · Zona Franca',
      estado: 'EN_RUTA',
      condiciones_activas: [
        {
          codigo: 'RETRASADO',
          descripcion: 'Retrasado',
          desde: '2026-09-09T10:20:00Z',
        },
      ],
      eta: {
        estado: 'ausente_por_degradacion',
        motivo: 'procesamiento no disponible',
        ultimo_dato_en: '2026-09-09T10:20:00Z',
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
      folio: 'AI27-000103',
      origen: 'Monterrey · Apodaca',
      destino: 'Saltillo · Derramadero',
      estado: 'SOLICITADO',
      condiciones_activas: [],
      eta: null,
      operador_nombre: 'Ana G.',
      progreso_pct: 10,
      estado_seguimiento: { etiqueta: 'En Tránsito', tono: 'info', icono: 'en-transito' },
      velocidad_promedio_kmh: 58,
      temperatura_carga_c: 5,
      bateria_gps_pct: 85,
    },
  ],
  notificaciones: [
    {
      id: 'notif-1',
      severidad: 'critica',
      titulo: 'Desvio de ruta detectado',
      cuerpo: 'La unidad del viaje AI27-000102 salio de la geocerca en un tramo peligroso.',
      ocurrio_en: '2026-09-09T11:58:00Z',
    },
    {
      id: 'notif-2',
      severidad: 'informativa',
      titulo: 'Llegada a destino',
      cuerpo: 'El viaje AI27-000098 se completo con exito en CEDIS Norte.',
      ocurrio_en: '2026-09-09T11:15:00Z',
    },
  ],
} as const;
