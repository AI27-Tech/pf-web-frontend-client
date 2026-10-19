# Tareas — E8-T1 CI y línea base de calidad (portal cliente)

- [x] 1. Verificar que la secuencia de calidad corre local
  - `pnpm install --frozen-lockfile`: OK (29s)
  - `pnpm lint`: OK (sin errores)
  - `pnpm test`: OK — **131 pruebas en 20 archivos** (no "24", como decía la historia; el dato real es 131/20)
  - `pnpm typecheck`: **falla en checkout limpio** → ver hallazgo 1 abajo
  - `pnpm test:e2e`: **8 de los specs e2e fallaban de forma determinista** (no flakiness) → ver hallazgo 2. Arreglados; ahora **17 pasan, 13 se omiten** (11 de `panel.spec` ya estaban omitidos porque el Panel está cerrado mientras `GET /api/v1/panel` no exista; 2 de tema oscuro omitidos por decisión, ver hallazgo 2).
  - **Hallazgo 1 (routeTree.gen):** `src/routeTree.gen.ts` está en `.gitignore` y lo genera el plugin de TanStack Router dentro de `vite`. `tsc --build` no lo genera, así que typecheck y test (que importan el router) exigen **regenerar las rutas primero**. Tras `pnpm exec vite build --mode mock`, typecheck pasa (exit 0). No hay CLI `tsr`; la generación ocurre vía vite. Implicación: en CI hay que generar rutas antes de typecheck/test.
  - **Hallazgo 2 (e2e desalineados con la UI actual):** la suite e2e estaba escrita contra una UI anterior. Correcciones aplicadas (todas en las pruebas, sin tocar la app):
    - `getByLabel('Estado')` resolvía 2 elementos → `{ exact: true }`.
    - Paginación: la `Pagination` del design system usa aria-labels en inglés ("Next page"/"Previous page") y muestra "1–3 of 6" dentro del nav "Pagination"; se actualizaron los selectores y el texto de conteo (antes buscaban "Pagina siguiente" y "Mostrando … registros", que ya no existen).
    - Los `Checkbox` del design system ocultan el input tras un recuadro que intercepta el clic → `.check({ force: true })` (igual que el radio del paso 1).
    - Detalle de viaje con condición activa: `EstadoViajeChip` **reemplaza** la etiqueta del estado por la condición; la prueba afirmaba ver "EN_RUTA" y la condición a la vez → corregida al comportamiento real.
    - Sidebar: el `<nav>` no tiene nombre accesible "Principal"; se apunta al enlace directo.
    - Confirmación de solicitud: el `Card` con aria-label no es landmark `region`; se afirma sobre el contenido visible.
    - Tema oscuro (2 pruebas): V1 no tiene conmutador de tema; `.dark` no altera el fondo. Se marcaron `test.skip` con el motivo, hasta que exista theming. **A confirmar con PO si debe existir toggle de tema en V1.**
  - _Requisitos: R3_

- [x] 2. Crear el workflow de CI
  - `.github/workflows/ci.yml` con disparo `push` a `pf-wfc-m/d/q` + `pull_request`
  - Job `calidad`: install + **generar rutas (`vite build --mode mock`)** + lint + typecheck + test
  - Job `e2e`: install + `playwright install --with-deps chromium` + test:e2e (el `playwright.config.ts` ya hace el build mock, que regenera rutas)
  - Node 22, pnpm 12.3.4, caché de pnpm. YAML validado (sin diagnósticos).
  - _Requisitos: R1, R2_

- [x] 3. Agregar los workflows de promoción
  - `promotion-pr-dq.yml` y `promotion-pr-qm.yml` copiados de `pf-svc-identidad` sin cambios
  - No fusionan; derivan la rama por sufijo. YAML validado.
  - _Requisitos: R4_

- [ ] 4. Subir la rama y abrir el PR hacia dev
  - **Pendiente: requiere push, que no se hace sin autorización del usuario.**
  - `git push -u origin feature/e8-t1-ci-calidad`
  - Crear PR hacia `pf-wfc-d` con `gh pr create`
  - Confirmar que el workflow arranca y ambos jobs pasan en verde
  - _Requisitos: R1_

- [ ] 5. Prueba negativa deliberada
  - Introducir un error de tipos trivial, confirmar que el job `calidad` queda en rojo
  - Revertir el error y confirmar verde de nuevo
  - Anotar el resultado en el PR
  - _Requisitos: R6_

- [ ] 6. Branch protection (requiere permisos de admin)
  - Marcar `calidad` y `e2e` como required checks en `pf-wfc-d` (y en `pf-wfc-q`/`pf-wfc-m` según política)
  - Habilitar en la org que Actions pueda crear PRs (para los workflows de promoción)
  - Se entrega como guía (artifact compartido para los tres repos); la activación la hace quien tenga permisos
  - _Requisitos: R5, R4_
