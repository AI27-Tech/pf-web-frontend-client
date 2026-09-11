# pf-web-frontend-client

`portal-cliente` — la aplicación web **de cara al cliente** de la plataforma AI27. SPA en React + TypeScript.

Es la superficie que usa el _cliente de una transportista_ para solicitar un servicio, seguir un `viaje` en tiempo real y hablar con la operación por la conversación de negocio. Corre enteramente bajo `Audiencia: Cliente`.

> La autoridad arquitectónica vive en [`docs/arquitectura/`](../../docs/arquitectura/_index.md) del workspace padre. Este README no la reexplica y no reabre las decisiones cerradas. Empieza por [`services/bff.md`](../../docs/arquitectura/services/bff.md) y [`services/realtime.md`](../../docs/arquitectura/services/realtime.md).

**Estado: scaffold funcional y navegable.** Compila, pasa lint y tipos en modo estricto, 20 pruebas unitarias y 13 e2e en verde. Con el modo mock se puede entrar y recorrer la app entera contra un `bff` y un `realtime` simulados, seguimiento por SSE incluido. Las pantallas corren contra tipos provisionales; **no hay lógica de negocio implementada** y el contrato del backend todavía no existe (ver [Decisiones abiertas](#decisiones-abiertas)).

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
| Mapa               | **MapLibre GL 6.7**                                   | Instalado, **no montado todavía** — ver `TrackingMap.tsx`                                     |
| Pruebas            | **Vitest 5** + Testing Library + **Playwright 1.63**  | —                                                                                             |
| Lint / formato     | **ESLint 10** + typescript-eslint 8.70 + Prettier 3.9 | —                                                                                             |

Todas las versiones están fijadas exactas en `package.json`, sin rangos.

Dos desviaciones respecto de lo que pedía el prompt de scaffolding, ambas deliberadas:

- **TypeScript 6, no 5 ni 7.** TS 7.0.2 es la última, pero `typescript-eslint@8.70` declara `typescript >=4.8.4 <6.1.0`: con TS 7 no hay lint con tipos. TS 6 es la más nueva que la cadena de herramientas soporta.
- **No hay `tailwind.config.ts`.** Tailwind 4 configura por CSS. Crear un `tailwind.config.ts` vacío para cumplir el árbol del prompt sería ceremonia.

Un aviso de peer conocido: `openapi-typescript@7.13.0` quiere `typescript@^5.x`. Es la herramienta de codegen, que hoy está bloqueada de todas formas.

---

## Las dos rutas de datos, y la regla que las gobierna

**Hay una sola forma de payload de tracking y un solo parser**, llegue el dato por pull o por push. Es la propiedad **P4**.

```
                 ┌──────────────────────────────────────┐
                 │       pf-web-frontend-client         │
                 │  lib/tracking/parseTrackingPayload   │
                 │        ← un solo parser →            │
                 └───────┬───────────────────┬──────────┘
                         │                   │
   PULL · HTTP           │                   │   PUSH · SSE
   GET /api/v1/viajes/   │                   │   GET /api/v1/stream
        {id}/tracking    ▼                   ▼
                    ┌─────────┐         ┌──────────┐
                    │   bff   │         │ realtime │
                    └─────────┘         └──────────┘
                         └── mismo ALB, servicio distinto ──┘
```

`bff` **no proxea el stream**: la conexión SSE va directo a `realtime`. De ahí que haya dos base URLs en el entorno, no una.

Dónde está cada pieza:

| Pieza                                       | Archivo                                       |
| ------------------------------------------- | --------------------------------------------- |
| El parser único                             | `src/lib/tracking/parseTrackingPayload.ts`    |
| Cliente SSE (reanudación, latido, liveness) | `src/lib/stream/streamClient.ts`              |
| Conmutación push → polling                  | `src/lib/degradation/mode.ts`                 |
| Las dos rutas convergiendo                  | `src/features/tracking/useTracking.ts`        |
| La prueba de que no divergen                | `tests/tracking/parseTrackingPayload.test.ts` |

### Reglas del cliente, y cómo están hechas cumplir

No son comentarios: cada una tiene un mecanismo.

| Regla                                                                                       | Mecanismo en el código                                                                                                                      |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordenar y deduplicar por la secuencia **de dominio**, nunca por el `seq` del sobre (**P5**) | `TransportSeq` y `DomainSeq` son tipos marcados **sin conversión entre ellos** en `lib/contracts/sequences.ts`. Confundirlos no compila     |
| El navegador no selecciona canales arbitrarios (**P10**)                                    | `Canal` es un tipo marcado sin constructor libre. Solo existen `canalViaje` y `canalConversacion` — y **no existe `canalFlota`**            |
| Ausente por degradación no es ausente                                                       | `Fresco<T>` tiene **tres** estados, no dos: `presente`, `ausente-por-degradacion`, `sin-dato`. `FreshnessMark` renderiza los tres distinto  |
| Un aguas-abajo caído no es un "no encontrado"                                               | `ApiErrorKind` separa `degradado` de `noEncontrado`; `ErrorState` los presenta distinto                                                     |
| Latido 4 s / liveness 7 s                                                                   | `STREAM_TIMINGS` en `lib/constants.ts`, aplicado en `streamClient.ts`                                                                       |
| Stream vivo pero silencioso degrada a polling                                               | El estado `vivo-sin-datos` existe y `deriveDegradation` lo manda a polling                                                                  |
| La degradación se muestra                                                                   | `DegradationBanner` en el shell, con `role="status"`                                                                                        |
| Sin librerías prohibidas                                                                    | `no-restricted-imports` en `eslint.config.js` bloquea zustand, redux, jotai, swr, framer-motion, next-auth, aws-amplify, Radix, MUI, Chakra |
| Los artefactos generados no se filtran                                                      | `no-restricted-imports` prohíbe importar `lib/api/generated/*` fuera de `src/lib/`                                                          |

---

## El backend simulado

`src/mocks/` contiene un `bff` y un `realtime` de mentira sobre MSW. Se activan solo con
`VITE_ENABLE_MOCKS=true`, que vive en `.env.mock` y se carga con `--mode mock`; el import
es dinámico, así que con la bandera apagada ni MSW ni los handlers entran en el bundle.

**La decisión que hace que estos mocks valgan algo: devuelven la forma de contrato
(`snake_case`, envoltorios de frescura), no modelos de la app.** Así la app corre su
parser de verdad. Si devolvieran `TrackingPayload` ya construido, saltarían la única pieza
que hay que ejercitar y solo se comprobaría que React pinta objetos.

El dataset cubre a propósito los tres estados de `Fresco<T>`:

| Viaje     | Qué demuestra                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `viaje-1` | Camino feliz. **Recibe posiciones por SSE cada 2 s**, con snapshot de apertura, latido cada 4 s y `Last-Event-ID`                                                        |
| `viaje-2` | `procesamiento` caído: payload **parcial y marcado**. El estado sigue visible; posición y ETA llegan como `ausente-por-degradacion`, con motivo y último dato etiquetado |
| `viaje-3` | Recién solicitado: `sin-dato`. Nunca hubo posición, y eso **no** es lo mismo que no poder alcanzarla                                                                     |

En el sobre SSE el `seq` de transporte arranca en 1000 y la secuencia de dominio en 1 —
números deliberadamente distintos, para que cualquier confusión entre ambos se vea en
pantalla en lugar de esconderse tras una coincidencia numérica.

Lo que los mocks **no** hacen: máquina de estados de viaje, autorización real,
multi-tenancy. Sirven para trabajar en la UI y para que los e2e cubran el recorrido
autenticado; no para validar reglas de negocio.

Cuando exista `contracts/openapi/bff.yaml`, `src/mocks/data.ts` es lo primero que hay que
validar contra él: si el contrato usa otros nombres de campo, los mocks fallan y el parser
también — que es exactamente la señal que se busca.

### Seguimiento en Vivo: mismo contrato que el Panel de Control

`routes/_private/seguimiento/index.tsx` carga `getPanel()` — el mismo `loader` que usa el
Panel de Control — y le pasa `panel.viajesEnCurso` a `features/seguimiento/SeguimientoSection`.
No existe un endpoint ni un contrato propios de esta pantalla: las dos vistas leen el mismo
`ViajeEnCurso` de `lib/contracts/panel.ts`, porque describen el mismo viaje desde dos
ángulos, no dos datos distintos.

`ViajeEnCurso` trae seis campos que la tabla del panel no pinta pero que Seguimiento en Vivo
sí necesita, todos **PROVISIONALES** igual que el resto de `lib/contracts/`:

| Campo                  | Wire (`snake_case`)      | Para qué lo usa Seguimiento en Vivo                                                                                              |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `operadorNombre`       | `operador_nombre`        | Fila "OPERADOR" de la tarjeta                                                                                                    |
| `progresoPct`          | `progreso_pct`           | `ProgresoBar` (0–100)                                                                                                            |
| `estadoSeguimiento`    | `estado_seguimiento`     | `EstadoSeguimientoBadge`: etiqueta, tono e icono **autorados en el wire**, no derivados de `EstadoViaje` ni de `CondicionActiva` |
| `velocidadPromedioKmh` | `velocidad_promedio_kmh` | Barra de telemetría inferior                                                                                                     |
| `temperaturaCargaC`    | `temperatura_carga_c`    | Barra de telemetría inferior                                                                                                     |
| `bateriaGpsPct`        | `bateria_gps_pct`        | Barra de telemetría inferior                                                                                                     |

`estadoSeguimiento.tono` e `icono` son uniones abiertas (`'success' | 'warning' | 'info' |
(string & {})` y equivalente para el icono): un valor que la UI no reconoce se pinta en
neutro en `EstadoSeguimientoBadge`, la misma disciplina que ya sigue `EstadoViajeChip` con
los estados de viaje.

Cuando exista el contrato real, confirmar contra él si estos seis campos viajan en
`GET /panel` o si terminan en un endpoint de telemetría aparte; si es lo segundo,
`ViajeEnCurso` se separaría en dos tipos y `parsePanel.ts` dejaría de leerlos directamente.
Hasta entonces, vivir juntos evita inventar una frontera que el contrato no ha confirmado.

El acento de color de la barra izquierda de cada tarjeta (`features/seguimiento/rutaAccent.ts`)
es puramente decorativo y no viene del wire: rota entre los roles M3 `primary` /
`secondary` / `tertiary` por posición en la lista, así que respeta el tema oscuro sin
necesitar un rol de color nuevo.

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
│   ├── providers.tsx           # QueryClient + los tres Context
│   └── shell/                  # AppShell, nav, DegradationBanner
├── routes/                     # TanStack Router, file-based
│   ├── __root.tsx
│   ├── (auth)/                 # públicas: login, two-factor
│   ├── _private.tsx            # guarda: beforeLoad exige sesión
│   └── _private/               # todo lo autenticado
│       ├── index.tsx           # home: Panel de Control
│       ├── seguimiento/index.tsx  # Seguimiento en Vivo: tarjetas + mapa + telemetria
│       ├── viajes/{index,new,$viajeId/{index,tracking,bitacora}}
│       └── conversaciones/{index,$conversacionId}
├── features/                   # *Section y hooks por dominio
│   ├── sesion/ viajes/ tracking/ conversacion/ catalogos/ panel/ seguimiento/
├── components/ui/              # Button, Input, Table, Modal, FreshnessMark, Feedback
├── context/                    # SessionContext, DegradationContext, ModalContext
├── lib/
│   ├── api/                    # client + wrappers por dominio + tokenStore + errors
│   ├── contracts/              # tipos de contrato (PROVISIONALES) — barrel en index.ts
│   ├── tracking/               # EL parser único
│   ├── stream/                 # cliente SSE
│   ├── degradation/            # push ⇄ polling
│   ├── constants.ts  utils.ts
├── mocks/                      # bff y realtime simulados (MSW), solo en modo mock
└── styles/globals.css          # Tailwind + @theme
```

`src/routeTree.gen.ts` y `src/lib/api/generated/` son generados y están en `.gitignore`.

### Convención de nombres

Identificadores en inglés, **salvo los sustantivos de dominio**, que conservan su forma canónica en español: `viaje`, `bitacora`, `conversacion`, `catalogos`, `Audiencia`, `Fresco`, `Sobre`. Son el lenguaje ubicuo de `docs/arquitectura/` y de `contracts/`; traducirlos rompería la correspondencia con los tipos generados que van a sustituir a `lib/contracts/`. Comentarios y docstrings en español.

---

## Superficie que consume

Todo el HTTP por `bff` (`/api/v1/...`); el stream, por `realtime`.

| Área         | Endpoints                                                                                   | Wrapper                      |
| ------------ | ------------------------------------------------------------------------------------------- | ---------------------------- |
| Sesión       | `POST /sesion` · `POST /sesion/refresh` · `DELETE /sesion`                                  | `lib/api/sesion.ts`          |
| Viajes       | `POST /viajes` · `GET /viajes` · `GET /viajes/{id}` · `GET /viajes/{id}/bitacora`           | `lib/api/viajes.ts`          |
| Tracking     | `GET /viajes/{id}/tracking` — pull y degradación                                            | `lib/api/viajes.ts`          |
| Catálogos    | `GET /catalogos/...`                                                                        | `lib/api/catalogos.ts`       |
| Conversación | `GET /conversaciones` · `/{id}/mensajes` · `POST /{id}/mensajes` · `/{id}/receipts/lectura` | `lib/api/conversaciones.ts`  |
| Stream       | `GET /api/v1/stream?canales=...`                                                            | `lib/stream/streamClient.ts` |

Solo audiencia cliente. Bandejas, claim/release/transfer, reportes y auditoría son de `panel-admin`.

Sobre la sesión: la identidad es Cognito detrás de `identidad`, y el login va contra **`bff`**, no contra Cognito — por eso no hay `next-auth` ni `aws-amplify` (y ESLint los bloquea). El refresco es el punto donde los claims se reevalúan, así que `SessionContext` refresca con margen en vez de esperar el `401`. Un `401` a media conexión significa "reconecta tras refrescar", no "error de datos".

---

## Pruebas

20 unitarias, 13 e2e. No cubren funcionalidad — cubren las **invariantes**:

| Archivo                                       | Qué prueba                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/tracking/parseTrackingPayload.test.ts` | **La prueba de contrato de P4**: la misma entrada por pull y por sobre de push produce el mismo resultado. Y que la degradación se preserva en vez de colapsarse a `null`                                                                                                                      |
| `tests/contracts/sequences.test.ts`           | Que el orden sale de la secuencia de dominio y no del orden de llegada; detección de huecos                                                                                                                                                                                                    |
| `tests/degradation/mode.test.ts`              | Que `vivo-sin-datos` degrada a polling **y avisa**                                                                                                                                                                                                                                             |
| `tests/ui/FreshnessMark.test.tsx`             | Que la ausencia por degradación se renderiza, con motivo y último dato etiquetado                                                                                                                                                                                                              |
| `e2e/login.spec.ts`                           | Que la app arranca, que login renderiza y que la guarda de rutas privadas redirige                                                                                                                                                                                                             |
| `e2e/journey.spec.ts`                         | El recorrido autenticado contra los mocks: que **la posición se actualiza por push sin recargar**, que un payload degradado marca la ausencia y conserva el estado, que `sin-dato` no se presenta como degradación, que la conversación ordena por secuencia de dominio, y el envío de mensaje |

Los e2e corren contra el bundle de producción construido en modo mock. Los de `login.spec.ts` no dependen de la API; los de `journey.spec.ts` van contra el backend simulado.

---

## Decisiones abiertas

Ninguna está resuelta en el código. Cada una tiene un `TODO` en su sitio.

| #   | Decisión                                                                                                                        | Dónde está marcada                                                        | Qué bloquea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`contracts/` no existe.** No hay repo backend ni remoto: `openapi/bff.yaml`, `events/` y `estados/` no están en ninguna parte | `scripts/gen-contracts.mjs`, cabecera de cada archivo de `lib/contracts/` | **El bloqueo grande.** Los tipos de `lib/contracts/` son provisionales, escritos a mano desde `docs/arquitectura/`. Los nombres de campo del wire —tanto en el parser como en `src/mocks/data.ts`— son suposiciones en `snake_case`: la documentación fija el _requisito_ de que la degradación viaje marcada, no su serialización. Los mocks desbloquean el trabajo de UI pero **no reducen este riesgo**: confirman que la app es coherente consigo misma, no con el backend. `gen:contracts` falla con instrucciones |
| 2   | **Custodia del token en el navegador**                                                                                          | `lib/api/tokenStore.ts`                                                   | ADR 8 cierra el proveedor, no el almacenamiento. Hoy hay una implementación con `localStorage` **solo para que el scaffold arranque**, aislada tras una interfaz. `localStorage` es lo peor ante XSS; memoria + refresh en cookie `httpOnly` es mejor pero exige que `bff` ponga esa cookie, y el contrato no lo dice                                                                                                                                                                                                   |
| 3   | **ADR 16** — ¿el trigger de Cognito reevalúa claims en el refresco?                                                             | `context/SessionContext.tsx`                                              | Si no lo hace, un cambio de rol no se refleja hasta relogin y hace falta una ruta de relogin forzado                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4   | **ADR 10** — ¿existe `realtime` en V1?                                                                                          | `lib/constants.ts` (`STREAM_ENABLED`)                                     | Sin `VITE_STREAM_BASE_URL` la app corre pull-only y `lib/stream/` queda sin cablear. Funciona hoy                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 5   | **ADR 4** — política de colchón del ETA de cliente                                                                              | `lib/contracts/tracking.ts`                                               | Cuál de los dos números de ETA cruza al cliente. `Eta` modela solo uno                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6   | **ADR 6**                                                                                                                       | —                                                                         | La ruta `POST /panico` (V2). No está scaffoldeada                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | **ADR 13** — ¿entrega Cognito el OTP?                                                                                           | `routes/(auth)/two-factor.tsx`                                            | Si lo entrega, esta ruta puede no existir. Está como placeholder sin lógica                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 8   | **Señal de "ingesta degradada"**                                                                                                | `lib/contracts/envelope.ts`, `lib/stream/streamClient.ts`                 | El diseño exige que el servidor pueda decir "estoy vivo pero no recibo"; la **forma** de esa señal no está especificada. El cliente tiene el hueco preparado y un `TODO`                                                                                                                                                                                                                                                                                                                                                |
| 9   | **Cómo dibuja el mapa la incertidumbre**                                                                                        | `features/tracking/TrackingMap.tsx`                                       | MapLibre está instalado y **sin montar**, a propósito: interpolar entre dos posiciones separadas por 35 s es el "mapa que miente". Antes de montarlo hay que decidir cómo se pinta una posición vieja, qué se pinta cuando falta por degradación, y si la traza es polilínea o puntos discretos                                                                                                                                                                                                                         |
| 10  | **Accesibilidad contra "sin librerías de componentes"**                                                                         | `components/ui/Modal.tsx`                                                 | El modal usa `<dialog>` nativo, que da foco atrapado, Escape y restauración de foco gratis. Si más adelante hacen falta combobox, menús o popovers posicionados, conviene revisar la restricción antes de reimplementar un focus manager                                                                                                                                                                                                                                                                                |
