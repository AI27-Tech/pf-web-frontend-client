# Prototipo V2 — Seguimiento en vivo (NO productivo)

> **Esto NO forma parte de V1.** Es un prototipo congelado que se retiró del release
> path del portal cliente en **E9-T10** (cierra el hallazgo **F-06**). No se compila,
> no se enruta, no entra en el bundle de producción y no es alcanzable por navegación.
> La carpeta `prototipos-v2/` queda **fuera** de `tsconfig.app.json` (que solo incluye
> `src` y `tests`) y de ESLint (ignorada en `eslint.config.js`), a propósito.

## Por qué se aisló

`DEC-001` excluye de V1 el seguimiento en vivo: sin marcador de posición, sin estado de
señal, sin ETA continua, sin geocercas. La auditoría clasificó esta superficie como
**deriva de alcance** — se construyó mapa, SSE y posición cuando el producto V1 no los
tiene. `ADR 27` fija que los hitos y el ETA de V1 van por **polling HTTP**, no por SSE, y
`ADR 28` cerró el contrato V1 de `realtime` para entregar **solo** la superficie viva de
`mensajeria`, sin sobres de posición/tracking.

El endpoint que alimentaba esto, `GET /api/v1/viajes/{id}/tracking`, es **V2 y no
aparece en el tracer** (verificado contra `contracts/openapi/bff.yaml`).

## Qué se conservó en V1 (no está aquí)

Esto NO es telemetría y V1 sí lo necesita para el **ETA obsoleto** (E9-T5), así que se
quedó en `src/`:

- `src/lib/contracts/freshness.ts` — el tipo `Fresco<T>` con sus tres estados.
- `src/components/ui/FreshnessMark.tsx` — la marca de frescura/obsolescencia.
- `src/lib/contracts/eta.ts` — el tipo `Eta`.
- `src/lib/seguimiento/parseEtaWire.ts` — los parsers puros de ETA y condiciones (los usa el panel).
- `src/lib/seguimiento/formatEta.ts` — el formato del ETA.

## Qué vive aquí (el prototipo congelado)

| Archivo                                                                    | Qué era                                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `useSeguimiento.ts`                                                        | Hook que unía las dos rutas de datos (pull + SSE) sobre una sola caché.                                                        |
| `SeguimientoDetalleSection.tsx`                                            | Pantalla de detalle: posición, ETA, geocercas.                                                                                 |
| `MapaSeguimiento.tsx`                                                      | Placeholder del mapa de posición (destino de MapLibre).                                                                        |
| `streamClient.ts`                                                          | Cliente SSE contra `realtime` (reanudación, latido, liveness).                                                                 |
| `parseSeguimientoPayload.ts`                                               | Parser único del payload de seguimiento (P4).                                                                                  |
| `contracts/seguimiento.ts`                                                 | Tipos `Posicion`, `EventoGeocerca`, `SeguimientoPayload`.                                                                      |
| `contracts/canales.ts`                                                     | `Canal` como tipo cerrado (P10).                                                                                               |
| `contracts/envelope.ts`                                                    | El sobre SSE con `prioridad`/`ttl_seg`/`dedup_key`. Importa `TransportSeq` de `@/lib/contracts/sequences`, que se quedó en V1. |
| `degradation/mode.ts` · `DegradationContext.tsx` · `DegradationBanner.tsx` | Conmutación push ⇄ polling y su aviso.                                                                                         |
| `mocks/stream.ts` · `seguimientoWire.ts`                                   | El `realtime` simulado y sus fixtures.                                                                                         |
| `route-seguimiento.tsx`                                                    | La ruta `/viajes/$viajeId/seguimiento` (ya no registrada).                                                                     |
| `tests/`                                                                   | Las pruebas del prototipo (ya no las corre Vitest).                                                                            |

## El aprendizaje que esto preserva (insumo válido para tracking V2)

Dos ideas de este prototipo siguen siendo buen insumo para el seguimiento V2 y por eso
**no se borraron**:

1. **La separación entre secuencia de transporte y secuencia de dominio**: el `seq` del
   sobre solo reanuda; el orden en pantalla lo decide la secuencia de dominio. El tipo
   `DomainSeq` y el ordenado por dominio **se quedaron en V1** (`src/lib/contracts/sequences.ts`),
   porque la conversación de negocio (mensajería) ya los usa; la mitad de transporte
   (`TransportSeq`, `transportSeqToLastEventId`) vive allí también como documentación de
   la invariante.
2. **El sobre con `prioridad` / `ttl_seg` / `dedup_key`** (`envelope.ts`): el servidor
   lleva la contabilidad; el cliente no reordena ni revalida.

Para revivir esto en V2 habrá que reintroducir sus piezas en `src/` de forma deliberada,
confirmadas contra el contrato de `realtime` de ese momento — no reconectando esta
carpeta tal cual.
