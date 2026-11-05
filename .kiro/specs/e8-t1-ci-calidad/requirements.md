# E8-T1 — CI y línea base de calidad (portal cliente)

|                     |                                                                           |
| ------------------- | ------------------------------------------------------------------------- |
| **Épica / eje**     | E8 — panel/portales de frontend (eje de entrega, no épica funcional)      |
| **Tarea**           | E8-T1 — CI y línea base de calidad de los tres repos de frontend          |
| **Repositorio**     | `pf-web-frontend-client`                                                  |
| **Rama base**       | `pf-wfc-d` (dev)                                                          |
| **Rama de trabajo** | `feature/e8-t1-ci-calidad`                                                |
| **Fuente**          | `ai27-platform-context/docs/historias-tecnicas/E8-panel-admin.md` → E8-T1 |
| **Dependencias**    | Ninguna (no depende del contrato)                                         |

## Alcance de este spec

E8-T1 abarca **tres repos**. Este spec cubre **solo** la parte de `pf-web-frontend-client`. Las partes de `pf-web-frontend-internal` y `pf-library-frontend-components` tienen su propio spec en cada repo, para que quede historial independiente por repo.

`client` es el repo que ya tiene todo el andamiaje de pruebas (vitest con pruebas reales, Playwright configurado, husky versionado). Aquí **no se construye andamiaje**: se agrega el workflow de CI que ejecuta lo que ya existe, se adopta el flujo de ramas automatizado de la plataforma, y se verifica que todo pasa.

E8-T1, por instrucción del equipo, incluye también el **flujo de ramas dev → qa → main** copiado del patrón de los backends (`pf-svc-identidad`, `pf-pkg-contracts`). No es solo la línea base de CI.

## Historia técnica

Como equipo de desarrollo, necesito que lint, typecheck, pruebas unitarias y end-to-end corran en cada pull request de `pf-web-frontend-client`, para que la calidad no dependa de que alguien se acuerde de ejecutarlas.

## Estado verificado hoy (rama dev)

- Scripts presentes: `lint`, `typecheck`, `test` (vitest run), `test:e2e` (playwright), `build:mock`.
- `tests/` con pruebas reales: subdirectorios `contracts/`, `panel/`, `ui/`, `viajes/`, más `setup.ts` y `support/`.
- `e2e/` con 5 specs: `historial`, `journey`, `login`, `panel`, `solicitud`.
- `playwright.config.ts` ya construye el bundle en modo mock (`vite build --mode mock`) y lo sirve con `preview`; el modo mock es el único que incluye MSW.
- `.husky/pre-commit` versionado (lint-staged + typecheck completo).
- **No existe workflow de CI**: `.github/` solo tiene `pull_request_template.md`.

## Requisitos

### R1 — Workflow de CI (estilo plataforma)

El repo DEBE tener un workflow de GitHub Actions alineado al patrón de los backends (`pf-svc-identidad`): dispara en **push a las tres ramas** (`pf-wfc-m`, `pf-wfc-d`, `pf-wfc-q`) y en **cada `pull_request`**, y ejecuta `lint`, `typecheck`, `test` y `test:e2e`.

**Criterios de aceptación:**

- Un PR con error de lint falla el workflow.
- Un PR con error de tipos falla el workflow.
- Un PR con una prueba unitaria rota falla el workflow.
- Un PR con un e2e roto falla el workflow.
- Tras una promoción fusionada, el push a la rama destino vuelve a correr el CI (señal verde/roja por rama).

### R2 — Los e2e corren sobre el bundle mock

Los end-to-end DEBEN ejecutarse contra el bundle construido en modo mock (`vite build --mode mock` + `preview`), que es el único que incluye MSW. El `playwright.config.ts` ya lo hace; el workflow solo instala los navegadores de Playwright y ejecuta `test:e2e`.

### R3 — Las pruebas existentes corren y pasan en CI

Los archivos de prueba unitaria y los e2e que ya existen en el repo DEBEN ejecutarse en CI y pasar. El número exacto se confirma al correr; el criterio es que ninguno quede excluido del pipeline.

### R4 — Flujo de ramas automatizado (dev → qa → main)

El repo DEBE adoptar el flujo de promoción semiautomatizado de la plataforma, copiando los dos workflows gemelos de `pf-svc-identidad`/`pf-pkg-contracts`:

- `promotion-pr-dq.yml`: en cada push a `*-d`, mantiene abierto y al día **un** PR de `*-d` → `*-q`.
- `promotion-pr-qm.yml`: en cada push a `*-q`, mantiene abierto y al día **un** PR de `*-q` → `*-m`.

Los dos derivan la rama destino del sufijo, por lo que funcionan sin cambios con `pf-wfc-d/q/m`. **No fusionan**: la promoción es por merge manual en ambos tramos. **No existe auto-merge** (el `automerge-promotion.yml` que menciona un comentario del patrón no está implementado en ningún repo; no se crea aquí).

**Criterios de aceptación:**

- Un push a `pf-wfc-d` crea/actualiza el PR hacia `pf-wfc-q` con el resumen de lo pendiente.
- Un push a `pf-wfc-q` crea/actualiza el PR hacia `pf-wfc-m`.
- Ningún workflow fusiona automáticamente.

### R5 — Compuerta de fusión (fuera del código)

Un PR con el workflow en rojo NO DEBE poder fusionarse. Esto requiere activar _branch protection_ con _required checks_ en la configuración del repo en GitHub, que no se versiona como código. Este spec entrega el workflow listo y una guía de activación; la activación la hace alguien con permisos de admin del repo.

### R6 — Prueba negativa deliberada

DEBE demostrarse, con una prueba negativa deliberada (romper tipos o una prueba a propósito y confirmar que el workflow bloquea), que la compuerta funciona. La prueba negativa se revierte después de confirmarla.

## Fuera de alcance

- No se toca la lógica de la aplicación ni se agregan pruebas de producto nuevas (el andamiaje y las pruebas ya existen).
- No se define umbral de cobertura mínima como compuerta: primero que las pruebas corran.
- Integración de `@ai27-tech/ui` (eso es E8-T2).
