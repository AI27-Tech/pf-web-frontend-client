/*
 * Emergencia del viaje, contra `bff` (E9-T9, AI27-28). Carril de audiencia Cliente.
 *
 * El `bff` (contrato `tracer.20`) ya monta las tres rutas y las proyecta por audiencia:
 * el cliente recibe la vista MÍNIMA (caso por fecha/hora + estado), nunca cuerpos de
 * nota, responsable, recursos ni personal de Reacción (ADR 21 §6). Estos wrappers solo
 * transportan la forma del contrato; la proyección la hace el servidor, no el navegador.
 *
 * Idempotencia de la activación: la lleva el CUERPO, no un header. El contrato pide
 * `ActivarEmergenciaClienteEntrada.activacion_id`, una clave que genera el cliente por
 * pulsación intencional. Una reentrega técnica del MISMO `activacion_id` devuelve el
 * caso original (200); una pulsación nueva (otro `activacion_id`) crea otro caso (201).
 * Por eso NO se usa el header `Idempotency-Key` del cliente HTTP aquí.
 */

import { api } from './client';
import type {
  ActivarEmergenciaClienteEntrada,
  EmergenciaCliente,
  EmergenciasCliente,
  NotaEmergenciaClienteEntrada,
} from '../contracts';

/**
 * Vista mínima de las emergencias del viaje para el cliente (ADR 21 §6):
 * `{ emergencia_activa, casos:[{ id, estado, activada_en }] }`. `cerrada` no aparece.
 */
export async function listEmergencias(
  viajeId: string,
  signal?: AbortSignal,
): Promise<EmergenciasCliente> {
  return api.get<EmergenciasCliente>(
    `/viajes/${viajeId}/emergencias`,
    signal !== undefined ? { signal } : {},
  );
}

/**
 * Activa una emergencia sobre el viaje. Idempotente por `activacion_id` del cuerpo:
 * la reentrega del mismo id devuelve el caso original (200); un id nuevo crea otro
 * caso (201). El `bff` devuelve el `EmergenciaCliente` resultante en ambos casos, así
 * que el wrapper no distingue 200 de 201: el llamante recibe el caso vigente.
 */
export async function activarEmergencia(
  viajeId: string,
  entrada: ActivarEmergenciaClienteEntrada,
): Promise<EmergenciaCliente> {
  return api.post<EmergenciaCliente>(`/viajes/${viajeId}/emergencias`, entrada);
}

/**
 * Agrega una nota a un caso de emergencia. El contrato recorta el cuerpo a ≤1000 y no
 * lo guarda si queda vacío; el llamante NO debe enviar un cuerpo vacío o de solo
 * espacios (se valida antes, en la UI). La respuesta es 201 sin cuerpo (void).
 */
export async function agregarNotaEmergencia(
  viajeId: string,
  emergenciaId: string,
  entrada: NotaEmergenciaClienteEntrada,
): Promise<void> {
  return api.post<void>(`/viajes/${viajeId}/emergencias/${emergenciaId}/notas`, entrada);
}
