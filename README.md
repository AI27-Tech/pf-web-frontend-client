# pf-web-frontend-client

`portal-cliente` — la aplicación web **de cara al cliente** de la plataforma AI27. SPA en React + TypeScript.

Es la superficie que usa el _cliente de una transportista_ para solicitar un servicio, seguir un `viaje` en tiempo real y hablar con la operación por la conversación de negocio. Corre enteramente bajo `Audiencia: Cliente`.

> La autoridad arquitectónica vive en [`docs/arquitectura/`](../../docs/arquitectura/_index.md) del workspace padre. Este README no la reexplica y no reabre las decisiones cerradas. Empieza por [`services/bff.md`](../../docs/arquitectura/services/bff.md) y [`services/realtime.md`](../../docs/arquitectura/services/realtime.md).

**Estado: scaffold funcional y navegable.** Compila, pasa lint y tipos en modo estricto, y tiene pruebas unitarias y e2e en verde. Con el modo mock se puede entrar y recorrer la app entera contra un `bff` simulado. Las pantallas corren contra tipos provisionales; **no hay lógica de negocio implementada** y el contrato del backend todavía no existe (ver [Decisiones abiertas](#decisiones-abiertas)).

> **Seguimiento en vivo retirado de V1 (E9-T10 / F-06).** La superficie de posición, señal, geocercas y stream SSE era V2 (la excluye `DEC-001`) y se aisló como prototipo no productivo e inalcanzable en [`prototipos-v2/seguimiento-vivo/`](./prototipos-v2/seguimiento-vivo/README.md). V1 obtiene los hitos y el ETA por HTTP (polling, `ADR 27`), no por SSE. Lo que V1 sí usa —`Fresco<T>`, `FreshnessMark` y el ETA— se conservó. Partes de este README que describen "las dos rutas de datos" y el mapa reflejan el estado anterior; se corrigen al tocar cada sección.

---

## Cómo empezar

Hay dos formas de arrancar. Mientras no exista el backend, **usa la segunda**.

```bash
pnpm install

# a) contra un bff real — todavía no existe, ver Decisiones abiertas
cp .env.example .env.local
pnpm run dev

# b) contra el bff y el realtime simulados  <- lo que funciona hoy
pnpm run dev:mock                          # http://localhost:5173
```

En modo mock se entra con **`cliente@demo.ai27`** / **`demo1234`**.

| Script                    | Qué hace                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- |
| `dev`                     | Dev server de Vite, sin mocks                                                    |
| `dev:mock`                | Dev server con `bff` y `realtime` simulados                                      |
| `build`                   | `tsc --build` y luego el bundle de producción                                    |
| `build:mock`              | Igual, pero con los mocks embarcados. Solo para pruebas                          |
| `preview`                 | Sirve el bundle ya construido                                                    |
| `typecheck`               | TypeScript en modo estricto, sin emitir                                          |
| `lint` · `lint:fix`       | ESLint                                                                           |
| `format` · `format:check` | Prettier                                                                         |
| `test` · `test:watch`     | Vitest + Testing Library                                                         |
| `test:e2e`                | Playwright. Construye en modo mock y corre contra el bundle                      |
| `gen:contracts`           | Tipos desde el contrato del backend — **hoy falla a propósito**: no hay contrato |

El repo fija `pnpm@12.3.4` en `packageManager`. Si no tienes pnpm: `corepack enable pnpm`.

`test:e2e` necesita el navegador una primera vez: `pnpm exec playwright install chromium`.

### Pre-commit

Husky + lint-staged: formato y lint sobre lo _staged_, más `typecheck` del proyecto completo. El typecheck va completo a propósito — un cambio de tipo en `lib/` rompe consumidores que no están en el commit, y lint-staged no los vería.

---

## Lo que no es

| No es esto                                    | Dónde vive                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `panel-admin` — la consola interna y de flota | repo aparte, `Audiencia: Interno`                                            |
| Nada que hable con nueve servicios            | es exactamente lo que `bff` existe para evitar                               |
| Ningún lugar donde se filtre por audiencia    | el filtrado es del servidor, **antes** de publicar (**P10**)                 |
| Un punto de decisión de autorización          | los claims del token son toda la historia; el navegador nunca amplía alcance |

---

## Stack

| Preocupación       | Elección                                              | Nota                                                                                          |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Framework          | **React 19.2.8**                                      | —                                                                                             |
| Lenguaje           | **TypeScript 6.0.3**, `strict`                        | Más `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`            |
| Build / dev server | **Vite 8.2.2** (Rolldown)                             | —                                                                                             |
| Router             | **TanStack Router 1.170**                             | File-based; `src/routeTree.gen.ts` es generado                                                |
| Estado de servidor | **TanStack Query 5.102**                              | Dueño de la ruta pull, la caché y el respaldo por polling                                     |
| Estado de cliente  | **React Context**                                     | Sin Zustand/Redux/Jotai. Tres contextos y ni uno más: sesión, degradación, modal              |
| Estilos            | **Tailwind 4.3.3**                                    | Config en CSS (`@theme` en `src/styles/globals.css`). **Por eso no hay `tailwind.config.ts`** |
| Componentes UI     | ninguno                                               | Sin shadcn/Radix/MUI/Chakra/Framer. Primitivas propias en `src/components/ui/`                |
| Mapa               | ninguno                                               | MapLibre se retiró con el seguimiento vivo V2 (E9-T10 / F-06). V1 no monta mapa               |
| Pruebas            | **Vitest 5** + Testing Library + **Playwright 1.63**  | —                                                                                             |
| Lint / formato     | **ESLint 10** + typescript-eslint 8.70 + Prettier 3.9 | —                                                                                             |

Todas las versiones están fijadas exactas en `package.json`, sin rangos.

Dos desviaciones respecto de lo que pedía el prompt de scaffolding, ambas deliberadas:

- **TypeScript 6, no 5 ni 7.** TS 7.0.2 es la última, pero `typescript-eslint@8.70` declara `typescript >=4.8.4 <6.1.0`: con TS 7 no hay lint con tipos. TS 6 es la más nueva que la cadena de herramientas soporta.
- **No hay `tailwind.config.ts`.** Tailwind 4 configura por CSS. Crear un `tailwind.config.ts` vacío para cumplir el árbol del prompt sería ceremonia.

Un aviso de peer conocido: `openapi-typescript@7.13.0` quiere `typescript@^5.x`. Es la herramienta de codegen, que hoy está bloqueada de todas formas.

---

## Transporte de datos en V1: HTTP

En V1 el portal lee por **HTTP** contra `bff`: el listado y el detalle del viaje, el panel y la conversación de negocio. Los hitos y el ETA del seguimiento se obtienen por **polling HTTP** (`ADR 27`), no por SSE: ese es el transporte normal de E2, no una degradación.

> **Las dos rutas de datos (pull HTTP + push SSE) y su parser único eran V2.** Esa arquitectura —`GET /viajes/{id}/tracking` + `GET /stream`, un solo parser `parseSeguimientoPayload`, el cliente SSE con reanudación/latido/liveness, y la conmutación push ⇄ polling— se aisló del release path de V1 en [`prototipos-v2/seguimiento-vivo/`](./prototipos-v2/seguimiento-vivo/README.md) (E9-T10 / F-06). Sigue siendo insumo válido para el seguimiento vivo de V2, pero no entra en el bundle de V1.

La conversación de negocio sí ordena por la secuencia **de dominio** (E9-T8); el contrato V1 de `realtime` (`ADR 28`) entrega únicamente la superficie viva de `mensajeria`, sin sobres de posición/tracking.

### Reglas del cliente que V1 conserva, y cómo están hechas cumplir

No son comentarios: cada una tiene un mecanismo.

| Regla                                                         | Mecanismo en el código                                                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordenar y deduplicar por la secuencia **de dominio** (**P5**) | `DomainSeq` es un tipo marcado sin conversión desde `TransportSeq`, en `lib/contracts/sequences.ts`. Lo usa la conversación de negocio      |
| Ausente por degradación no es ausente                         | `Fresco<T>` tiene **tres** estados, no dos: `presente`, `ausente-por-degradacion`, `sin-dato`. `FreshnessMark` renderiza los tres distinto  |
| Un aguas-abajo caído no es un "no encontrado"                 | `ApiErrorKind` separa `degradado` de `noEncontrado`; `ErrorState` los presenta distinto                                                     |
| Sin librerías prohibidas                                      | `no-restricted-imports` en `eslint.config.js` bloquea zustand, redux, jotai, swr, framer-motion, next-auth, aws-amplify, Radix, MUI, Chakra |
| Los artefactos generados no se filtran                        | `no-restricted-imports` prohíbe importar `lib/api/generated/*` fuera de `src/lib/`                                                          |

Las reglas del transporte SSE —canales como tipo cerrado (`Canal`, P10), latido 4 s / liveness 7 s, y la conmutación a polling ante un stream vivo pero silencioso— viven ahora con el prototipo V2 en `prototipos-v2/seguimiento-vivo/`.

---

## El backend simulado

`src/mocks/` contiene un `bff` de mentira sobre MSW. Se activa solo con
`VITE_ENABLE_MOCKS=true`, que vive en `.env.mock` y se carga con `--mode mock`; el import
es dinámico, así que con la bandera apagada ni MSW ni los handlers entran en el bundle.

> El `realtime` simulado (SSE sobre un `ReadableStream`) alimentaba el seguimiento vivo V2 y se archivó con el prototipo en `prototipos-v2/seguimiento-vivo/mocks/stream.ts` (E9-T10 / F-06). Los handlers de V1 ya no incluyen `GET /stream` ni `GET /viajes/:id/tracking`.

**La decisión que hace que estos mocks valgan algo: devuelven la forma de contrato
(`snake_case`, envoltorios de frescura), no modelos de la app.** Así la app corre su
parser de verdad. Si devolvieran los modelos ya construidos, saltarían la única pieza
que hay que ejercitar y solo se comprobaría que React pinta objetos.

El dataset del panel cubre a propósito los tres estados de `Fresco<Eta>`:

| Viaje     | Qué demuestra                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `viaje-1` | Camino feliz: ETA presente                                                                                                     |
| `viaje-2` | `procesamiento` caído: ETA **ausente por degradación**, con motivo y último dato etiquetado; el estado del viaje sigue visible |
| `viaje-3` | Recién solicitado: `sin-dato`. Nunca hubo ETA, y eso **no** es lo mismo que no poder alcanzarlo                                |

Lo que los mocks **no** hacen: máquina de estados de viaje, autorización real,
multi-tenancy. Sirven para trabajar en la UI y para que los e2e cubran el recorrido
autenticado; no para validar reglas de negocio.

Cuando exista `contracts/openapi/bff.yaml`, `src/mocks/data.ts` es lo primero que hay que
validar contra él: si el contrato usa otros nombres de campo, los mocks fallan y el parser
también — que es exactamente la señal que se busca.

### Seguimiento en Vivo: retirado de V1 (E9-T10 / F-06)

La pantalla «Seguimiento en Vivo» (`/seguimiento`) **ya no forma parte de V1**. Reusaba
`getPanel()` para renderizar telemetría viva —mapa, velocidad, temperatura de carga y
batería del GPS—, superficie que `DEC-001` excluye del alcance V1 (sin marcador de
posición, sin señal, sin ETA continua). Se retiró del release path en **E9-T10** (cierra el
hallazgo **F-06**) y vive aislada, congelada y no productiva, en
`prototipos-v2/seguimiento-vivo/` (fuera de `tsconfig.app.json` y de ESLint; no se compila,
no se enruta, no entra en el bundle).

Como consecuencia, el contrato compartido `ViajeEnCurso` (`lib/contracts/panel.ts`) quedó
depurado: trae **solo** lo que el Panel de Control y el Historial muestran de un viaje en
curso (`viajeId`, `folio`, `origen`, `destino`, `estado`, `condicionesActivas`, `eta`). Los
seis campos de telemetría (`operadorNombre`, `progresoPct`, `estadoSeguimiento`,
`velocidadPromedioKmh`, `temperaturaCargaC`, `bateriaGpsPct`) y la interfaz
`EstadoSeguimiento` se movieron al prototipo. Lo que V1 **sí** conserva en `src/` es
`Fresco<T>` y `FreshnessMark` (para el ETA obsoleto, E9-T5): la marca de frescura no es
telemetría.

Lo que V1 sabe de un viaje en curso se ve en el **Panel de Control** (`/`) y el **Historial
de Viajes** (`/viajes`). Para revivir el seguimiento en V2 habrá que reintroducir las piezas
del prototipo de forma deliberada, confirmadas contra el contrato de `realtime` de ese
momento, no reconectando la carpeta tal cual.

### Historial de Viajes: listado enriquecido y paginado en cliente

`routes/_private/viajes/index.tsx` carga `listViajes()` — el listado plano de
`GET /api/v1/viajes` — y se lo pasa a `features/viajes/historial/HistorialViajesSection`,
que compone encabezado, barra de filtros y tabla. La tabla reutiliza la MISMA primitiva
`components/ui/Table` que el Panel de Control; el Historial la usa con `headerTone='filled'`,
`rowTone` (resalta en tono de error la fila de un viaje cancelado) y `porPagina`.

`ViajeResumen` sumó cuatro campos para esta pantalla, todos **PROVISIONALES** igual que el
resto de `lib/contracts/`:

| Campo              | Para qué                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `origenSitio`      | Segunda línea de la columna de ruta ("Almacén Central"). Puede ser `null`  |
| `destinoSitio`     | Segunda línea del destino. Puede ser `null`                                |
| `unidad`           | Vehículo, placa y conductor. `null` cuando el viaje aún no tiene unidad    |
| `reporteSeguridad` | Icono de la columna "Reporte Seguridad". Unión abierta, como `EstadoViaje` |

`unidad: null` no es decoración: un viaje recién `SOLICITADO` no tiene unidad, y la celda
dice "Sin asignar" en vez de fingir un vehículo — la misma disciplina de no inventar datos
que sigue `Fresco`.

Dos cosas son del servidor y hoy **no** están cableadas, a propósito:

- **El filtrado** (`HistorialFiltros`) es solo frontend: los campos se pueden usar y
  conservan su valor, pero no filtran nada y el botón "Filtrar" está deshabilitado con su
  motivo. El día que exista el contrato, alimentarán un search param de la ruta (patrón de
  `login.tsx`) que el `loader` leerá con `loaderDeps` para pedir a `bff` la página ya
  filtrada. No se filtra en cliente: la lista completa no vive en el navegador.
- **La paginación** hoy es **estado de UI** dentro de `Table` (`porPagina`): el servidor
  entrega la lista completa y la tabla la recorta. `TODO(contracts)`: cuando `bff` pagine,
  esto se mueve al mismo search param + `loaderDeps` y la tabla recibe solo la página actual.
- **Exportar CSV** está deshabilitado: la exportación la resolverá `bff` con el alcance del
  tenant, no un armado en cliente.

---

## Dónde vive el fetch

No hay Server Components: es una SPA. La disciplina equivalente es **cargar en la frontera de la ruta**:

- El archivo de ruta declara su carga con el `loader` de TanStack Router, o con `useQuery` en el hook del dominio cuando el dato se actualiza después (tracking, conversación).
- Las `*Section` reciben datos **por props** y no llaman a la API. Son presentacionales.
- Carga y error se resuelven con `pendingComponent` y `errorComponent` de cada ruta — el equivalente de `loading.tsx` / `error.tsx`.
- El estado de interacción vive en los subcomponentes hoja: `MensajeComposer`, no `ConversacionSection`.

Cero `useEffect` + `useState` para traer datos. El único `useEffect` con E/S es el que abre el stream, y eso no es un fetch.

### Solicitar nuevo servicio: un asistente de una sola ruta

`/viajes/new` es un asistente de cuatro pasos (Servicio y Fecha → Ruta → Detalles → Revisar)
más una pantalla de confirmación. Es **una sola ruta**, no una por paso: el paso actual vive
en el search param `?paso=` (`servicio`/`ruta`/`detalles`/`revisar`/`enviada`), y el borrador
vive en un `useReducer` dentro de `SolicitarServicioWizard`. Continuar, Regresar y los enlaces
"Editar" son navegación real (`navigate({ search: { paso } })`), de modo que el botón atrás y
el enlace directo a un paso funcionan.

**No hay backend:** "Enviar solicitud" NO hace `POST /viajes` ni crea registro. Genera un ID
simulado (`AI27-YYMMDD-NNN`) en el cliente y muestra el acuse. El borrador se modela como
`BorradorSolicitud` en `lib/contracts/dominio.ts` (PROVISIONAL, separado de `SolicitudViaje`);
cuando exista el contrato real, ahí se decide qué subconjunto cruza al backend.

Para integrar datos reales luego, esos catálogos son lo primero que se valida contra el contrato,
igual que el resto del dataset mock.

---

## Estructura

```
src/
├── main.tsx
├── app/
│   ├── router.tsx              # instancia del router, tipos registrados
│   ├── queryClient.ts          # política de reintento = taxonomía de errores
│   ├── providers.tsx           # QueryClient + SessionProvider + ModalProvider
│   └── shell/                  # AppShell, nav
├── routes/                     # TanStack Router, file-based
│   ├── __root.tsx
│   ├── (auth)/                 # públicas: login, two-factor
│   ├── _private.tsx            # guarda: beforeLoad exige sesión
│   └── _private/               # todo lo autenticado
│       ├── index.tsx           # home: Panel de Control
│       ├── seguimiento/index.tsx  # Seguimiento en Vivo (lista): tarjetas + telemetria
│       ├── viajes/{index,new,$viajeId/{index,bitacora}}
│       └── conversaciones/{index,$conversacionId}
├── features/                   # *Section y hooks por dominio
│   ├── sesion/ viajes/ conversacion/ catalogos/ panel/ seguimiento/
├── components/ui/              # Button, Input, Table, Modal, FreshnessMark, Feedback
├── context/                    # SessionContext, ModalContext
├── lib/
│   ├── api/                    # client + wrappers por dominio + tokenStore + errors
│   ├── contracts/              # tipos de contrato (PROVISIONALES) — barrel en index.ts
│   ├── seguimiento/            # formatEta + parsers V1 de ETA/condiciones
│   ├── constants.ts  utils.ts
├── mocks/                      # bff simulado (MSW), solo en modo mock
└── styles/globals.css          # Tailwind + @theme

prototipos-v2/seguimiento-vivo/  # PROTOTIPO V2 aislado (E9-T10 / F-06): no se compila,
                                 # no se enruta, fuera del bundle. Ver su README.
```

`src/routeTree.gen.ts` y `src/lib/api/generated/` son generados y están en `.gitignore`.

### Convención de nombres

Identificadores en inglés, **salvo los sustantivos de dominio**, que conservan su forma canónica en español: `viaje`, `bitacora`, `conversacion`, `catalogos`, `Audiencia`, `Fresco`, `Sobre`. Son el lenguaje ubicuo de `docs/arquitectura/` y de `contracts/`; traducirlos rompería la correspondencia con los tipos generados que van a sustituir a `lib/contracts/`. Comentarios y docstrings en español.

---

## Superficie que consume

Todo el HTTP por `bff` (`/api/v1/...`).

| Área         | Endpoints                                                                                   | Wrapper                     |
| ------------ | ------------------------------------------------------------------------------------------- | --------------------------- |
| Sesión       | `POST /sesion` · `POST /sesion/refresh` · `DELETE /sesion`                                  | `lib/api/sesion.ts`         |
| Viajes       | `POST /viajes` · `GET /viajes` · `GET /viajes/{id}` · `GET /viajes/{id}/bitacora`           | `lib/api/viajes.ts`         |
| Catálogos    | `GET /catalogos/...`                                                                        | `lib/api/catalogos.ts`      |
| Conversación | `GET /conversaciones` · `/{id}/mensajes` · `POST /{id}/mensajes` · `/{id}/receipts/lectura` | `lib/api/conversaciones.ts` |

Solo audiencia cliente. Bandejas, claim/release/transfer, reportes y auditoría son de `panel-admin`.

El seguimiento vivo (`GET /viajes/{id}/tracking` pull y `GET /api/v1/stream` SSE) era V2 y se retiró del release path de V1 (E9-T10 / F-06); vive en `prototipos-v2/seguimiento-vivo/`.

Sobre la sesión: la identidad es Cognito detrás de `identidad`, y el login va contra **`bff`**, no contra Cognito — por eso no hay `next-auth` ni `aws-amplify` (y ESLint los bloquea). El refresco es el punto donde los claims se reevalúan, así que `SessionContext` refresca con margen en vez de esperar el `401`. Un `401` a media conexión significa "reconecta tras refrescar", no "error de datos".

---

## Pruebas

No cubren funcionalidad — cubren las **invariantes**:

| Archivo                             | Qué prueba                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/contracts/sequences.test.ts` | Que el orden sale de la secuencia de dominio y no del orden de llegada; detección de huecos                                                          |
| `tests/ui/FreshnessMark.test.tsx`   | Que la ausencia por degradación se renderiza, con motivo y último dato etiquetado — la marca de frescura que V1 usa para el ETA obsoleto             |
| `tests/panel/formatEta.test.ts`     | Que el ETA se formatea por día de calendario ("Hoy"/"Mañana"/fecha), sin disfrazar un día de otro                                                    |
| `e2e/login.spec.ts`                 | Que la app arranca, que login renderiza y que la guarda de rutas privadas redirige                                                                   |
| `e2e/journey.spec.ts`               | El recorrido autenticado contra el mock: que la conversación ordena por secuencia de dominio, el envío de mensaje, el detalle de viaje y la bitácora |

Las pruebas del seguimiento vivo V2 (el parser único P4, la degradación push ⇄ polling, el recorrido de posición por SSE) se archivaron con el prototipo en `prototipos-v2/seguimiento-vivo/tests/` y ya no las corre Vitest (E9-T10 / F-06).

Los e2e corren contra el bundle de producción construido en modo mock. Los de `login.spec.ts` no dependen de la API; los de `journey.spec.ts` van contra el backend simulado.

---

## Decisiones abiertas

Ninguna está resuelta en el código. Cada una tiene un `TODO` en su sitio.

| #   | Decisión                                                                                                                        | Dónde está marcada                                                        | Qué bloquea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`contracts/` no existe.** No hay repo backend ni remoto: `openapi/bff.yaml`, `events/` y `estados/` no están en ninguna parte | `scripts/gen-contracts.mjs`, cabecera de cada archivo de `lib/contracts/` | **El bloqueo grande.** Los tipos de `lib/contracts/` son provisionales, escritos a mano desde `docs/arquitectura/`. Los nombres de campo del wire —tanto en el parser como en `src/mocks/data.ts`— son suposiciones en `snake_case`: la documentación fija el _requisito_ de que la degradación viaje marcada, no su serialización. Los mocks desbloquean el trabajo de UI pero **no reducen este riesgo**: confirman que la app es coherente consigo misma, no con el backend. `gen:contracts` falla con instrucciones |
| 2   | **Custodia del token en el navegador**                                                                                          | `lib/api/tokenStore.ts`                                                   | ADR 8 cierra el proveedor, no el almacenamiento. Hoy hay una implementación con `localStorage` **solo para que el scaffold arranque**, aislada tras una interfaz. `localStorage` es lo peor ante XSS; memoria + refresh en cookie `httpOnly` es mejor pero exige que `bff` ponga esa cookie, y el contrato no lo dice                                                                                                                                                                                                   |
| 3   | **ADR 16** — ¿el trigger de Cognito reevalúa claims en el refresco?                                                             | `context/SessionContext.tsx`                                              | Si no lo hace, un cambio de rol no se refleja hasta relogin y hace falta una ruta de relogin forzado                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4   | **ADR 10 / ADR 28** — `realtime` en V1                                                                                          | `prototipos-v2/seguimiento-vivo/`                                         | El seguimiento vivo por SSE era V2 y se aisló (E9-T10 / F-06). V1 lee hitos y ETA por HTTP (`ADR 27`); `realtime` V1 entrega solo la superficie viva de `mensajeria` (`ADR 28`)                                                                                                                                                                                                                                                                                                                                         |
| 5   | **ADR 4** — política de colchón del ETA de cliente                                                                              | `lib/contracts/eta.ts`                                                    | Cuál de los dos números de ETA cruza al cliente. `Eta` modela solo uno                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6   | **ADR 6**                                                                                                                       | —                                                                         | La ruta `POST /panico` (V2). No está scaffoldeada                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | **ADR 13** — ¿entrega Cognito el OTP?                                                                                           | `routes/(auth)/two-factor.tsx`                                            | Si lo entrega, esta ruta puede no existir. Está como placeholder sin lógica                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 8   | **Señal de "ingesta degradada"** (V2)                                                                                           | `prototipos-v2/seguimiento-vivo/`                                         | Pertenece al seguimiento vivo V2, aislado (E9-T10 / F-06). El diseño exige que el servidor pueda decir "estoy vivo pero no recibo"; la **forma** de esa señal sigue sin especificarse. No afecta a V1                                                                                                                                                                                                                                                                                                                   |
| 9   | **Cómo dibuja el mapa la incertidumbre** (V2)                                                                                   | `prototipos-v2/seguimiento-vivo/MapaSeguimiento.tsx`                      | El mapa de posición era V2 y se aisló (E9-T10 / F-06): MapLibre se retiró de V1. La decisión de cómo pintar una posición vieja o ausente queda para V2                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | **Accesibilidad contra "sin librerías de componentes"**                                                                         | `components/ui/Modal.tsx`                                                 | El modal usa `<dialog>` nativo, que da foco atrapado, Escape y restauración de foco gratis. Si más adelante hacen falta combobox, menús o popovers posicionados, conviene revisar la restricción antes de reimplementar un focus manager                                                                                                                                                                                                                                                                                |
