# 8 fallos e2e desfasados tras la migración a `@ai27-tech/ui`

Estado: diagnóstico listo para accionar (los arreglos están especificados abajo).
Rama: `pf-wfc-d`.
Dueño sugerido: Gonzalo (dueño del repo y de PR#4 "Component switch to AI27-tech library").
Reportado por: Fabricio, 2026-10-08.
Comando de verificación: `pnpm test:e2e` (requiere `@ai27-tech/ui` instalado; GitHub Packages pide token con `read:packages`).

---

## Resumen para quien mantiene

La suite e2e de Playwright tiene **8 fallos**, y son **preexistentes**: existen en el commit `ccb00ec` (PR#6 mergeado a `pf-wfc-d`), antes del commit `6a5ba65` que cerró el acceso al Panel de Control. Se confirmó corriendo la suite sobre el árbol limpio con `git stash` (misma lista exacta de 8 fallos, con y sin el cambio del panel).

**Causa raíz: la migración de componentes a `@ai27-tech/ui` (PR#4) cambió el DOM, los textos de UI y la palanca del tema, pero los e2e no se actualizaron.** No son 8 defectos independientes: son **3 causas raíz**. Ninguno es un defecto de producto; son pruebas desfasadas de la librería real. Casi con seguridad el e2e **nunca corrió verde después de PR#4**, porque sin el token de `@ai27-tech/ui` nadie podía instalar y ejecutarlo.

Todo lo de abajo está verificado contra el JS/CSS compilado del paquete instalado `@ai27-tech/ui@0.2.0-beta.1` (`node_modules/@ai27-tech/ui/dist/ui-library.{js,css}`), no inferido.

---

## Causa 1 — Tema oscuro por la palanca equivocada (2 fallos)

Fallos:

- `e2e/historial.spec.ts` → `historial · tema oscuro` (línea ~104).
- `e2e/solicitud.spec.ts` → `solicitud · tema oscuro` (línea ~133).

Ambos activan el modo oscuro con `document.documentElement.classList.add('dark')` y esperan que cambie `getComputedStyle(body).backgroundColor`. No cambia.

Causa raíz: la librería conmuta su tema por el atributo **`data-theme`** en `<html>`, no por la clase `.dark`. El fondo del body sale de `dist/ui-library.css` (`body{background-color:var(--ui-color-surface-muted)}`), y ese token solo cambia con `[data-theme=dark]` / `[data-theme=light]`. **Cero reglas `.dark`** en todo el CSS de la librería. `src/styles/globals.css` lo advierte explícitamente: "Para activar el oscuro completo, alterna tanto `.dark` como `data-theme='dark'`". Los tests solo tocan `.dark`.

Agravante del estado actual: `index.html` tiene hoy `<html lang="es" data-theme="dark">` (el comentario del archivo dice "light", está desactualizado). Así que el fondo "claro" que capturan al inicio ya es el oscuro, y nunca cambia.

Arreglo (solo test): activar el oscuro con `document.documentElement.setAttribute('data-theme', 'dark')` (y capturar el valor inicial con el `data-theme` de partida real). Es cambio de prueba, no de producto.

---

## Causa 2 — Textos y aria en inglés / distintos en los componentes de la librería (4 fallos)

- `e2e/historial.spec.ts:64` — espera `"Mostrando 1–3 de 6 registros"`. La `Pagination` real rinde `"1–3 of 6"` (inglés, números en `<b>`). `HistorialViajesTable.tsx` usa `hideCount` y delega el conteo a `<Pagination>`, así que el único conteo visible es el de la librería.
  Arreglo (test): afirmar contra el texto real `"1–3 of 6"`, o pedir a la librería un formato localizable si lo soporta (revisar `Pagination.d.ts`).

- `e2e/historial.spec.ts:45` — busca el botón `'Pagina siguiente'`. La librería nombra sus controles `"Next page"` / `"Previous page"`. No existe ese nombre → timeout.
  Arreglo (test): usar `getByRole('button', { name: 'Next page' })`.

- `e2e/solicitud.spec.ts:34` — busca `getByRole('navigation', { name: 'Principal' })`. El `<Sidebar>` de la librería no fija ese landmark name y `AppShell.tsx` **no se lo pasa** (verificado: el `<Sidebar>` no recibe `aria-label`). El link "Solicitar Servicio" sí existe; el ancestro `navigation[name=Principal]` no.
  Arreglo (código de app, el único de este grupo que NO es test): pasar `aria-label="Principal"` al `<Sidebar>` en `AppShell.tsx`. Mejora accesibilidad real (nombra el landmark de navegación) además de arreglar el test.

- `e2e/solicitud.spec.ts` — `check()` del checkbox "Alto Valor" hace timeout aunque el elemento es visible/enabled/stable. El `Checkbox` de la librería oculta el input nativo (`._nativeInput_s0lif_35{clip:rect(0,0,0,0);width:1px;height:1px;position:absolute}`) y pone una caja decorativa encima; Playwright no puede clickear el input real. Los radios que sí pasan en la misma suite usan `check({ force: true })`.
  Arreglo (test): usar `check({ force: true })` o clickear el `<label>` asociado.

---

## Causa 3 — Tests desfasados del render de la app (2 fallos)

- `e2e/historial.spec.ts:21` — `getByLabel('Estado')` resuelve a **2 elementos**: el `<select>` del filtro "Estado" y la `<table>` cuyo `aria-label` termina en "...y estado" (`HistorialViajesTable.tsx:171`). Playwright hace match por substring. Disparador: el `aria-label` largo que puso la app + el test no usa `{ exact: true }`.
  Arreglo (test): `getByLabel('Estado', { exact: true })`.

- `e2e/journey.spec.ts:83` — `getByText('EN_RUTA')` no aparece en `/viajes/viaje-2`. El detalle no rinde el literal: `EstadoViajeChip` mapea `EN_RUTA → "En Ruta"`, y viaje-2 además tiene una condición activa que tiene prioridad en el chip. El mock está correcto (`estado: 'EN_RUTA'`). Lo desfasado es la aserción.
  Arreglo (test): afirmar `getByText('En Ruta')`, o el texto de la condición activa que el chip prioriza.

---

## Alcance y propiedad

- 7 de 8 arreglos son del lado de los **tests**. 1 es código de app (`aria-label="Principal"` en `AppShell.tsx`), y es una mejora de accesibilidad legítima, no un hack para el test.
- Ninguno toca comportamiento de producto.
- Nace de PR#4, así que es trabajo del dueño del repo. Este documento deja el diagnóstico listo para accionar.

## Nota de proceso

Este diagnóstico se produjo al correr el gate completo del repo durante una tarea distinta (cerrar el acceso al Panel de Control, commit `6a5ba65`). Para instalar `@ai27-tech/ui` hizo falta un token de GitHub Packages con `read:packages`; sin él, `pnpm install` falla con 401 y el e2e no corre. Vale la pena que el repo documente ese requisito (p. ej. en su README o en un `.npmrc.example`) para que el gate no quede silenciosamente sin ejecutar.
