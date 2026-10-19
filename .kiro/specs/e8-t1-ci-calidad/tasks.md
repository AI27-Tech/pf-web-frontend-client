# Tareas — E8-T1 CI y línea base de calidad (portal cliente)

- [ ] 1. Verificar que la secuencia de calidad corre local
  - Ejecutar `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y confirmar que pasan
  - Ejecutar `pnpm test:e2e` y confirmar que los 5 specs e2e pasan sobre el bundle mock
  - Dejar anotado el conteo real de pruebas unitarias y e2e
  - _Requisitos: R3_

- [ ] 2. Crear el workflow de CI
  - Crear `.github/workflows/ci.yml` con disparo `push` a `pf-wfc-m/d/q` + `pull_request`
  - Job `calidad`: install + lint + typecheck + test
  - Job `e2e`: install + `playwright install --with-deps chromium` + test:e2e
  - Node 22, pnpm 12.3.4, caché de pnpm
  - _Requisitos: R1, R2_

- [ ] 3. Agregar los workflows de promoción
  - Copiar `promotion-pr-dq.yml` y `promotion-pr-qm.yml` de `pf-svc-identidad` sin cambios
  - Verificar que no fusionan y que derivan la rama por sufijo
  - _Requisitos: R4_

- [ ] 4. Subir la rama y abrir el PR hacia dev
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
