# Recorte del portal cliente al contrato `bff` (E8-T3, ampliación de alcance)

**Fecha:** 2026-10-20
**Repo:** `pf-web-frontend-client`
**Origen:** ampliación de alcance de E8-T3 — "el sistema debe crecer conforme al contrato, no al revés".

---

## 1. Qué se decidió y por qué

El portal cliente se construyó adelantándose a un contrato que, para varias pantallas,
todavía no existe. Sus tipos de dominio escritos a mano (`ViajeResumen`, `ViajeDetalle`,
panel, asistente de solicitud, conversación) asumían campos que el contrato real
(`@ai27-tech/contracts`, superficie `bff`, `v0.1.0-tracer.11`) no define.

**Principio aplicado:** cada pantalla se deja en su **versión mínima funcional apegada
al contrato**, sin inventar campos. Nada queda "roto": lo que el contrato respalda sigue
funcionando; lo que no, se **desconecta** (no se borra) para reconectarlo cuando el
contrato crezca. El encargado del repo reincorporará lo nuevo a la interfaz en ese
momento.

**Regla de oro:** `src/lib/contracts/` solo contiene lo que el contrato real define más
utilidades de presentación del frontend. Ningún tipo de wire se escribe a mano; si falta,
es una brecha del contrato, no algo que el portal rellena.

Esta decisión de alcance la aprobó Product Management (opción "recortar al contrato
hoy, aceptando la versión mínima"). No se amplió el contrato en este trabajo: eso es un
trabajo separado en `pf-pkg-contracts`.

---

## 2. Qué define el contrato `bff` para el cliente (tracer.11)

Lo único que el portal cliente puede consumir hoy:

| Superficie          | Forma                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Sesión              | `CredencialesEntrada {usuario, contrasena}` → `Sesion {sesion_id, access_token, expira_en, refresh_token?}` |
| Listado de viajes   | `ViajeResumen { id, estado, origen }`                                                                       |
| Detalle/seguimiento | `ViajeSeguimiento { id, hito{estado,etiqueta?}, eta?{valor,obsoleto}\|null, incidencias[] }`                |
| Crear viaje         | `CrearViajeEntrada { origen, destinos[], cliente_id?, fecha_hora_servicio?, tipo_servicio? }`               |
| Descarga de viaje   | `DescargaViaje` (solo interno; el cliente no la usa)                                                        |
| Estados             | enum `EstadoViaje` (13 valores, ADR 19)                                                                     |

**No** define: panel de control, bitácora del cliente, conversación/mensajes (viven en
`mensajeria.yaml`, superficie interna), ni los campos ricos del alta de servicio.

---

## 3. Cambios por pantalla

### Historial de viajes — recortado (conectado)

- `ViajeResumen` pasó a `{ id, estado, origen }`. Se retiraron `folio`, `destino`,
  `origenSitio`, `destinoSitio`, `unidad`, `reporteSeguridad`, `solicitadoEn`.
- Tabla de 5 columnas → 3 (ID enlazado, Origen, Estado).
- Celdas retiradas: `RutaCell`, `UnidadCell`, `ReporteSeguridadCell` (eliminadas; eran
  triviales de reescribir y no aportaban como referencia).
- `EstadoViaje` ahora es el enum **cerrado** del contrato; `EstadoViajeChip` mapea los
  13 estados reales y ya no recibe condiciones.

### Detalle de viaje — reconstruido (conectado)

- `ViajeDetalle` inventado → `ViajeSeguimiento` del contrato. La pantalla muestra la
  vista curada del cliente (DEC-006): hito, ETA con marca de obsolescencia, e
  incidencias curadas (categoría + estado + marca de tiempo). Sin folio/origen/destino.

### Solicitud de servicio — formulario mínimo (conectado) + asistente conservado

- Se creó `features/viajes/NuevaSolicitudForm.tsx`: captura solo `CrearViajeEntrada`
  (origen, destino, tipo de servicio, fecha) y **crea un viaje real** (POST `/viajes`).
- El asistente rico de 4 pasos (~20 campos) se **conservó** en
  `src/_desconectado/solicitud/`, con sus pruebas.

### Bitácora — desconectada

- `GET /viajes/{id}/bitacora` y `EntradaBitacora` no existen en el contrato. Ruta
  retirada del enrutado; componente y API conservados en `src/_desconectado/bitacora/`.

### Conversaciones — RECONECTADA (E9-T8 / E3-HU-014, AI27-27)

- El `bff` **sí** expone la conversación al cliente desde `tracer.26` (`GET/POST
/api/v1/viajes/{id}/conversacion[...]`), anclada al **viaje**, no a un
  `conversacion_id`. Se reconectó contra `tracer.27`:
  - Wrapper `src/lib/api/conversacion.ts`, hook `src/features/conversacion/useConversacion.ts`
    y componente `src/features/conversacion/ConversacionSection.tsx`.
  - Ruta colgada del viaje: `src/routes/_private/viajes/$viajeId/conversacion/`.
  - Tipos del contrato generado en el barrel (`ConversacionCliente`, `MensajeCliente`,
    `PaginaMensajesCliente`, `EnviarMensajeClienteEntrada`).
- `src/_desconectado/conversacion/` se **retiró** (su `api.ts` asumía una forma inventada:
  `idempotencyKey` como opción, rutas `/conversaciones/{id}`, paginación por cursor). El
  modelo real es una conversación POR VIAJE, paginada POR SECUENCIA (`antes_de`/`despues_de`),
  con el envío idempotente por `client_message_id` en el cuerpo.
- La entrada "Mensajes" NO vuelve a la navegación global: la conversación cuelga del
  detalle del viaje (`ViajeDetailSection`), que es donde el contrato la ancla.

### Panel de control — desconectado

- Ya estaba congelado (home redirige a `/viajes`). Toda la superficie (componentes,
  parser, ETA, API, tipos) se movió a `src/_desconectado/panel/`, con sus pruebas.

---

## 4. Convención de `src/_desconectado/`

- **Fuera de `src/routes/`**: las pantallas conservadas no se auto-registran como rutas
  ni son alcanzables por URL.
- **No importan de `@/lib/contracts`**: cada pieza lleva su tipo local provisional, para
  no contaminar el barrel con tipos que el contrato no define. Las utilidades de UI que
  sí se conservan en el barrel (`EstadoViaje`, `Fresco`, `Eta`, secuencias) sí se
  importan de ahí.
- **Mocks y handlers** sin uso se conservan con nota; sus handlers se retiran del
  conjunto activo de MSW.
- **Pruebas** se conservan: se mueven junto a su pieza (o se marcan `skip` en e2e) en
  vez de borrarse.

Ver el inventario vivo en `src/_desconectado/README.md`.

---

## 5. Cómo reconectar una pieza (cuando el contrato crezca)

1. Confirmar que el tracer publica la superficie (p. ej. `GET /viajes/{id}/bitacora`).
2. Sustituir el tipo local de la pieza por el generado de `@ai27-tech/contracts`.
3. Mover la pieza de `src/_desconectado/<pieza>/` a su ubicación de producción
   (`features/`, `lib/api/`, y recrear su archivo de ruta en `src/routes/` si aplica).
4. Reconectar su handler de mock y reactivar/mover sus pruebas.
5. Reexportar del barrel lo que el resto de la app deba consumir.

---

## 6. Qué NO cambió

- La capa de sesión y roles (el núcleo de E8-T3) — ya estaba apegada al contrato.
- Utilidades de presentación: `Fresco`/`FreshnessMark`, secuencias de dominio
  (`DomainSeq`, `orderByDomainSequence`), formato de ETA. No son tipos de wire.
- El contrato `pf-pkg-contracts`: no se tocó. Ampliarlo para estas pantallas es un
  trabajo separado.
