# Diseño — E8-T1 CI y línea base de calidad (portal cliente)

## Enfoque

`client` ya tiene scripts y pruebas. Los entregables de código son: **un workflow de CI** (`ci.yml`) y los **dos workflows de promoción** (`promotion-pr-dq.yml`, `promotion-pr-qm.yml`) copiados del patrón de la plataforma. No se modifica `package.json`, `playwright.config.ts` ni las pruebas.

## Workflow de CI

Archivo: `.github/workflows/ci.yml`.

**Disparo (estilo plataforma, igual que `pf-svc-identidad`):**

```yaml
on:
  push:
    branches: [pf-wfc-m, pf-wfc-d, pf-wfc-q]
  pull_request:
```

El `pull_request` sin filtro de rama valida cualquier PR; el `push` a las tres ramas da señal tras cada promoción fusionada.

**Entorno:** `ubuntu-latest`, Node 22, pnpm 12.3.4 (las versiones que fija `package.json`: `engines.node >=22`, `packageManager pnpm@12.3.4`).

**Estructura — dos jobs:**

1. `calidad` — lint + typecheck + test (unitarias)
   - `pnpm install --frozen-lockfile`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`

2. `e2e` — end-to-end sobre bundle mock
   - `pnpm install --frozen-lockfile`
   - `pnpm exec playwright install --with-deps chromium` (el config usa solo chromium)
   - `pnpm test:e2e`

Los dos jobs corren en paralelo; ambos deben pasar. Se separan porque el e2e descarga navegadores y tarda más; mantenerlo aparte da señal rápida de lint/typecheck/test sin esperar al e2e.

**Por qué no se construye el bundle en un paso aparte:** el `webServer` de `playwright.config.ts` ya corre `vite build --mode mock && vite preview`. Duplicarlo en el workflow sería redundante y podría divergir.

**Caché:** `actions/setup-node` con `cache: pnpm` para acelerar instalaciones. Opcional pero barato.

## Workflows de promoción (flujo de ramas)

Se copian **tal cual** de `pf-svc-identidad` (idénticos a los de `pf-pkg-contracts`), porque no tienen nada específico de backend: derivan la rama destino del sufijo (`${D_BRANCH%-d}-q`, `${Q_BRANCH%-q}-m`) y usan solo `gh` y git.

- `promotion-pr-dq.yml` — `on: push: branches: ['*-d']`. Mantiene un PR `*-d` → `*-q` abierto y con el cuerpo al día.
- `promotion-pr-qm.yml` — `on: push: branches: ['*-q']`. Mantiene un PR `*-q` → `*-m`.

Ambos con `permissions: pull-requests: write` y `GH_TOKEN: secrets.GITHUB_TOKEN`. **No fusionan.** No se crea ningún `automerge-promotion.yml`: ese nombre solo aparece en un comentario del patrón y no está implementado en ningún repo de la plataforma.

> Requisito de org para que el workflow pueda abrir PRs: en Settings → Actions → General, habilitar "Allow GitHub Actions to create and approve pull requests". Se anota en la guía de activación.

## Compuerta de fusión (branch protection)

GitHub Actions ejecuta; no bloquea el merge por sí solo. El bloqueo real exige marcar los checks del workflow como _required_ en branch protection de `pf-wfc-d`. Como eso no es código del repo, se entrega:

- El workflow con nombres de job estables (`calidad`, `e2e`) para referenciarlos como required checks.
- Una guía (artifact) con los pasos exactos en la UI de GitHub o por `gh` CLI.

## Prueba negativa deliberada

Para cumplir R5 sin dejar basura en el historial:

1. En la rama de trabajo, introducir un error de tipos trivial en un archivo de prueba o fuente.
2. Abrir/actualizar el PR y confirmar que el job `calidad` queda en rojo.
3. Revertir el error (commit de reversión o descartar) y confirmar verde.

Se documenta el resultado; no se deja el error commiteado en la rama final.

## Riesgos

- **e2e inestables en CI:** Playwright en CI a veces falla por timing. El `playwright.config.ts` ya pone `retries: 2` en CI y `forbidOnly`. Si hay flaky, se diagnostica, no se desactiva el e2e.
- **`frozen-lockfile` falla si el lockfile está desactualizado:** si `pnpm-lock.yaml` no cuadra con `package.json`, el install falla. Se verifica localmente antes de subir.
