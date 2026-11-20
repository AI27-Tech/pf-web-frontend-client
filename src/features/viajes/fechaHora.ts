/*
 * fechaHora — arma el `fecha_hora_servicio` del contrato a partir de los dos campos de
 * la solicitud, "Fecha" (`<input type="date">`, `YYYY-MM-DD`) y "Hora"
 * (`<input type="time">`, `HH:mm`).
 *
 * Lo que el backend espera (`MarcaTiempo` en `_comunes.yaml`): un solo instante en UTC,
 * RFC 3339 (`2026-11-20T15:30:00.000Z`). La fecha y la hora que el cliente captura son
 * la hora de pared de SU navegador; se combinan en esa zona y se convierten a UTC aquí,
 * una sola vez. Mandar solo fecha o solo hora no es válido para el contrato.
 *
 * Este módulo solo clasifica lo capturado: `vacio` es un resultado válido de la función. Si
 * la fecha/hora es obligatoria lo decide el formulario (hoy sí; DEC-010 y E1-HU-001 aún la
 * dan por opcional). No se rechazan fechas pasadas: la HU no define esa regla.
 *
 * Función pura, sin estado ni efectos.
 */

export type ResultadoFechaHora =
  /** Ni fecha ni hora: válido, el campo se omite del envío. */
  | { readonly estado: 'vacio' }
  /** Fecha y hora completas y reales; `iso` es el instante en UTC listo para el contrato. */
  | { readonly estado: 'valido'; readonly iso: string }
  /** Falta uno de los dos campos; no se puede formar un instante. */
  | { readonly estado: 'incompleto'; readonly falta: 'fecha' | 'hora' }
  /** Ambos tienen texto, pero no forman una fecha real (p. ej. año de 5 o 6 dígitos). */
  | { readonly estado: 'invalido' };

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const PATRON_HORA = /^(\d{2}):(\d{2})$/;

export function resolverFechaHora(fecha: string, hora: string): ResultadoFechaHora {
  const tieneFecha = fecha !== '';
  const tieneHora = hora !== '';

  if (!tieneFecha && !tieneHora) return { estado: 'vacio' };
  if (!tieneFecha) return { estado: 'incompleto', falta: 'fecha' };
  if (!tieneHora) return { estado: 'incompleto', falta: 'hora' };

  const coincideFecha = PATRON_FECHA.exec(fecha);
  const coincideHora = PATRON_HORA.exec(hora);
  if (coincideFecha === null || coincideHora === null) return { estado: 'invalido' };

  const anio = Number(coincideFecha[1]);
  const mes = Number(coincideFecha[2]);
  const dia = Number(coincideFecha[3]);
  const horas = Number(coincideHora[1]);
  const minutos = Number(coincideHora[2]);

  // Hora de pared del navegador. `setFullYear` evita que `new Date(año < 100, …)`
  // reinterprete el año como 19xx.
  const local = new Date(2000, 0, 1, 0, 0, 0, 0);
  local.setFullYear(anio, mes - 1, dia);
  local.setHours(horas, minutos, 0, 0);

  // Ida y vuelta: rechaza fechas inexistentes (31 de febrero) u horas fuera de rango,
  // que `Date` corregiría en silencio hacia otro día.
  const esReal =
    !Number.isNaN(local.getTime()) &&
    local.getFullYear() === anio &&
    local.getMonth() === mes - 1 &&
    local.getDate() === dia &&
    local.getHours() === horas &&
    local.getMinutes() === minutos;
  if (!esReal) return { estado: 'invalido' };

  return { estado: 'valido', iso: local.toISOString() };
}
