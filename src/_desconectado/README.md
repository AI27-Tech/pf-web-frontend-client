# Componentes desconectados (recorte al contrato)

Esta carpeta conserva pantallas y componentes que **funcionan**, pero cuyo respaldo
en el contrato `bff` todavía no existe. Se desconectaron (no se borraron) durante el
recorte al contrato de E8-T3, para reusarlos cuando el contrato crezca.

Reglas de esta carpeta:

- **No está bajo `src/routes/`**, así que sus pantallas no se auto-registran como
  rutas ni son alcanzables por URL. Reconectar = volver a crear el archivo de ruta
  en `src/routes/` que las monte.
- **No importa de `@/lib/contracts`**: cada pieza lleva su propio tipo local
  provisional, para no contaminar el barrel de contratos con tipos que el contrato
  real no define.
- Cuando el contrato publique la superficie correspondiente, el encargado del repo
  mueve la pieza de vuelta, cambia su tipo local por el generado y recrea su ruta.

Ver `docs/decisiones/2026-recorte-al-contrato-bff.md` para el porqué de cada recorte.

## Inventario

| Pieza        | Pantalla / función                                                                | Contrato que falta                                                                    |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `bitacora/`  | Bitácora visible al cliente de un viaje                                           | `GET /viajes/{id}/bitacora` + `EntradaBitacora`                                       |
| `solicitud/` | Asistente de alta de servicio en 4 pasos (pantalla activa: formulario mínimo)     | Campos extendidos de `CrearViajeEntrada` (contactos, carga, documentación, prioridad) |
| `panel/`     | Panel de control (indicadores, viajes en curso, notificaciones) + su parser y ETA | `GET /api/v1/panel` y toda la superficie de composición del panel                     |

> `conversacion/` se **reconectó** en E9-T8 / E3-HU-014 (AI27-27): el `bff` ya expone la
> conversación al cliente desde `tracer.26`, anclada al viaje. La feature vive ahora en
> `src/lib/api/conversacion.ts`, `src/features/conversacion/` y
> `src/routes/_private/viajes/$viajeId/conversacion/`. El modelo antiguo (lista de
> conversaciones con forma inventada) se retiró.
