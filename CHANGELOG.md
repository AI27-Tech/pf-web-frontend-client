# CHANGELOG

Todos los cambios relevantes del proyecto se documentan en este archivo.
Las entradas se escriben en español, con fecha en formato `yyyy:mm:dd` y hora en formato `hora:minuto`.
Las entradas más recientes se colocan al inicio.

## 2026:09:10 12:00

**Resumen:** Se quitó el `min-h-56` de `DetalleViajePlaceholderCard` y se igualó su padding al de `ViajesActivosCard`, para que el espacio de detalle mida exactamente lo mismo que "Viajes Activos" al alternar entre los dos.

**Cambios:**

- `DetalleViajePlaceholderCard` tenía `min-h-56` (heredado de `MapPlaceholderCard`, cuyo contexto es distinto) y `p-6`; `ViajesActivosCard` usa `p-4` sin altura mínima propia, porque su altura la fija el layout de `SeguimientoSection` (`items-stretch` en la fila `xl:flex-row`). Con la mínima puesta, el placeholder podía quedar más alto que la lista cuando esta tenía pocas tarjetas.
- Se quitó `min-h-56` y se cambió `p-6` a `p-4` en `DetalleViajePlaceholderCard`, alineando el padding sin tocar `ViajesActivosCard`.
- Se corrieron `pnpm typecheck`, `pnpm lint`, la suite unitaria de `tests/seguimiento/` (33/33) y la suite e2e de `e2e/seguimiento.spec.ts` (8/8): todo en verde. Se eliminó `test-results/` generado por la corrida de Playwright.

**Archivos modificados:**

- `src/features/seguimiento/DetalleViajePlaceholderCard.tsx`
- `CHANGELOG.md`

## 2026:09:10 11:27

**Resumen:** Se cambió el layout de Seguimiento en Vivo: "Viajes Activos" (o el detalle, cuando está abierto) ahora ocupa toda la altura de la pantalla, y la barra de telemetría se angostó al ancho de la columna del mapa en vez de ir a todo el ancho.

**Cambios:**

- Se cambió `SeguimientoSection` de un grid de dos filas (lista+mapa arriba, telemetría abajo a todo lo ancho) a un flex de dos columnas desde `xl`: la izquierda ("Viajes Activos" o `DetalleViajePlaceholderCard`) ocupa un tercio del ancho y toda la altura de la fila; la derecha apila el mapa y la telemetría, que ahora comparten ese mismo ancho. Por debajo de `xl` sigue apilando verticalmente, con la lista primero.
- La igualdad de alturas sale de `items-stretch` (el valor por defecto de un contenedor flex): sin rejilla ni alturas fijas, la columna izquierda estira tanto como la derecha necesite.
- Se actualizó `tests/seguimiento/SeguimientoSection.layout.test.tsx` para reflejar las clases nuevas (`flex-col`/`xl:flex-row`, `xl:w-1/3`) y para verificar que la telemetría queda debajo del mapa en la misma columna derecha, ya no como hermana de la lista.
- Se corrieron `pnpm typecheck`, `pnpm lint`, la suite unitaria de `tests/seguimiento/` (33/33) y las suites e2e de `e2e/seguimiento.spec.ts` y `e2e/panel.spec.ts` (19/19 combinadas): todo en verde. Se eliminó `test-results/` generado por las corridas de Playwright.

**Archivos modificados:**

- `src/features/seguimiento/SeguimientoSection.tsx`
- `tests/seguimiento/SeguimientoSection.layout.test.tsx`
- `CHANGELOG.md`

## 2026:09:10 11:12

**Resumen:** "Ver Detalles" en Seguimiento en Vivo dejó de navegar a `/viajes/$viajeId`: ahora alterna, dentro de la misma pantalla, entre "Viajes Activos" y un panel de detalle todavía sin implementar.

**Cambios:**

- Se creó `DetalleViajePlaceholderCard`, con el mismo criterio que `MapPlaceholderCard`: un hueco declarado, con icono decorativo (`aria-hidden`) y el texto "Más información" para que un lector de pantalla no se quede con un cuadro vacío.
- Se cambió `TelemetriaExtraCard`: el `Link` a `/viajes/$viajeId` se reemplazó por un `button` que alterna `mostrandoDetalle` (props `mostrandoDetalle` y `onAlternarDetalle`, nuevas). La etiqueta cambia entre "Ver Detalles" y "Volver a Viajes Activos" según el estado, con `aria-pressed` reflejándolo.
- `SeguimientoSection` pasó a poseer el estado `mostrandoDetalle` y a decidir qué se pinta en la columna angosta: `ViajesActivosCard` cuando está cerrado, `DetalleViajePlaceholderCard` cuando está abierto. Cambiar de viaje seleccionado no cierra el detalle: son dos decisiones independientes.
- Se actualizaron las pruebas unitarias de `TelemetriaExtraCard` (botón en vez de enlace, las dos etiquetas, `aria-pressed`) y se agregaron dos casos a `SeguimientoSection.test.tsx` que verifican el intercambio de paneles y el regreso.
- Se actualizó `e2e/seguimiento.spec.ts`: las pruebas que antes verificaban una navegación a `/viajes/viaje-1` ahora verifican que la URL sigue en `/seguimiento` y que el panel de la derecha cambia de "Viajes Activos" a "Detalle del viaje" y de vuelta.
- Se corrieron `pnpm typecheck`, `pnpm lint`, la suite unitaria de `tests/seguimiento/` (33/33) y la suite e2e de `e2e/seguimiento.spec.ts` (8/8): todo en verde. Se eliminó `test-results/` generado por las corridas de Playwright.

**Archivos modificados:**

- `src/features/seguimiento/DetalleViajePlaceholderCard.tsx`
- `src/features/seguimiento/TelemetriaExtraCard.tsx`
- `src/features/seguimiento/SeguimientoSection.tsx`
- `tests/seguimiento/TelemetriaExtraCard.test.tsx`
- `tests/seguimiento/SeguimientoSection.test.tsx`
- `e2e/seguimiento.spec.ts`
- `CHANGELOG.md`

## 2026:09:10 10:36

**Resumen:** Se quitó la barra de progreso visual de las tarjetas de "Viajes Activos" en Seguimiento en Vivo: "Progreso" ahora muestra únicamente el porcentaje como texto.

**Cambios:**

- Se eliminó `ProgresoBar.tsx`: ya no hay ninguna barra dibujada con `role="progressbar"`.
- Se quitó su uso de `ViajeActivoCard`; la fila "Progreso" pasó de una barra con etiqueta debajo a una fila de texto "Progreso" / porcentaje, con el mismo acotado a 0–100 que traía la barra (ahora en `progresoPctAcotado`, local al componente).
- Se quitaron las pruebas de `ProgresoBar` en `tests/seguimiento/ViajeActivoCard.test.tsx` y se agregaron en su lugar pruebas sobre `ViajeActivoCard`: que el porcentaje se muestra como texto, que no se dibuja ningún `role="progressbar"`, y que un valor fuera de rango se acota igual que antes.
- Se corrieron `pnpm typecheck`, `pnpm lint`, la suite unitaria de `tests/seguimiento/` (29/29) y la suite e2e de `e2e/seguimiento.spec.ts` (8/8): todo en verde. Se eliminó `test-results/` generado por la corrida de Playwright.

**Archivos modificados:**

- `src/features/seguimiento/ProgresoBar.tsx` (eliminado)
- `src/features/seguimiento/ViajeActivoCard.tsx`
- `tests/seguimiento/ViajeActivoCard.test.tsx`
- `CHANGELOG.md`

## 2026:09:10 10:21

**Resumen:** Se quitó el enlace "Ver Detalles" de cada tarjeta de "Viajes Activos" en Seguimiento en Vivo: esa navegación queda unicamente en la barra de telemetría inferior, para el viaje seleccionado.

**Cambios:**

- Se eliminó el `Link` a `/viajes/$viajeId` y el bloque que lo contenía en `ViajeActivoCard`; la tarjeta ya no importa `@tanstack/react-router`.
- Se actualizó el comentario de cabecera del componente para reflejar que "Ver Detalles" vive solo en `TelemetriaExtraCard`.
- Se ajustaron las pruebas unitarias de `ViajeActivoCard`: se quitó la aserción del enlace y se agregó una prueba que confirma que no aparece. Al no quedar ningún `Link`, esas pruebas ya no necesitan `renderConRouter` y usan `render` directo.
- Se actualizó `e2e/seguimiento.spec.ts`: la prueba de "Ver Detalles" por tarjeta se reemplazó por una que confirma que la lista de "Viajes Activos" no tiene ningún enlace de ese tipo, y se agregó una prueba de que seleccionar otro viaje cambia el destino del "Ver Detalles" de la barra de telemetría.
- Se corrieron `pnpm typecheck`, `pnpm lint`, la suite unitaria de `tests/seguimiento/` (30/30) y la suite e2e de `e2e/seguimiento.spec.ts` (8/8): todo en verde. Se eliminó `test-results/` generado por la corrida de Playwright.

**Archivos modificados:**

- `src/features/seguimiento/ViajeActivoCard.tsx`
- `tests/seguimiento/ViajeActivoCard.test.tsx`
- `e2e/seguimiento.spec.ts`
- `CHANGELOG.md`

## 2026:09:10 09:42

**Resumen:** Se rediseñó "Seguimiento en Vivo" (`/seguimiento`) para reemplazar el placeholder de "en construcción" por la pantalla completa del diseño: tarjetas de "Viajes Activos" con estado y progreso, un mapa de posición (reutilizando el placeholder existente) y una barra de telemetría del viaje seleccionado.

**Cambios:**

- Se extendió `ViajeEnCurso` en `lib/contracts/panel.ts` con seis campos nuevos —`operadorNombre`, `progresoPct`, `estadoSeguimiento` (etiqueta, tono e icono autorados directo en el wire), `velocidadPromedioKmh`, `temperaturaCargaC` y `bateriaGpsPct`— porque el Panel de Control y Seguimiento en Vivo comparten el mismo viaje en curso y no necesitan contratos separados. Se documentó la decisión y el mapeo de campos en el README.
- `estadoSeguimiento.tono` e `icono` son uniones abiertas, igual que el resto de catálogos del panel: un valor que la UI no reconoce se pinta en neutro en `EstadoSeguimientoBadge` en lugar de romper.
- Se actualizó `lib/panel/parsePanel.ts` para exigir los seis campos nuevos (`operador_nombre`, `progreso_pct`, `estado_seguimiento`, etc.): si faltan, el parser levanta `PanelPayloadError` en lugar de inventar un cero o una etiqueta.
- Se actualizó `panelWire()` en `mocks/data.ts` con datos realistas para los cinco viajes del panel, alineados con los números del diseño (velocidad, temperatura, batería, progreso y operador por viaje).
- Se reescribió `routes/_private/seguimiento/index.tsx` con el mismo patrón que el Panel de Control: `loader` con `getPanel()`, `pendingComponent` y `errorComponent`.
- Se creó `features/seguimiento/` con seis piezas nuevas: `EstadoSeguimientoBadge` (traduce tono/icono del wire a clases M3 y a un icono de `lucide-react`, con fallback neutro), `ProgresoBar` (`role="progressbar"` con los tres `aria-value*`, sin lo cual el progreso no se anuncia a un lector de pantalla), `rutaAccent.ts` (rota los roles M3 `primary`/`secondary`/`tertiary` por posición en la lista para el acento de color de cada tarjeta, decorativo y sin tokens nuevos), `ViajeActivoCard` (tarjeta seleccionable con folio, badge, ruta, operador, ETA en sus tres estados de `Fresco`, progreso y el enlace "Ver Detalles"), `ViajesActivosCard` (el contenedor con el contador "N En Ruta", calculado en el cliente a partir de `estado === 'EN_RUTA'`) y `TelemetriaExtraCard` (velocidad, temperatura y batería del viaje seleccionado, con su propio "Ver Detalles"; sin viaje seleccionado lo dice en vez de mostrar ceros).
- `SeguimientoSection` compone el layout: la lista de tarjetas y el mapa van lado a lado en pantallas anchas (`xl:grid-cols-3`, la lista ocupa una columna y el mapa dos), se apilan por debajo de `xl` con la lista primero, y la barra de telemetría queda a todo el ancho debajo, más ancha que la lista — tal como pide el diseño. El mapa reutiliza `MapPlaceholderCard` sin ningún cambio.
- La selección de tarjeta vive en `SeguimientoSection`: la primera va seleccionada por defecto y un click cambia cuál alimenta la barra de telemetría, sin persistencia más allá del estado del componente.
- "Contactar Operador" no se construyó, según lo acordado. "Ver Detalles" navega a `/viajes/$viajeId`, igual que el folio de la tabla del panel.
- Se agregaron 29 pruebas unitarias en `tests/seguimiento/` (badge, barra de progreso, acento de color, tarjeta con sus tres estados de ETA, selección, contador, estado vacío, composición de la sección, layout responsivo y el barrido de disciplina de color que falla si aparece un color crudo en `features/seguimiento/`).
- Se agregaron 7 pruebas e2e en `e2e/seguimiento.spec.ts`: contenido de las tarjetas y la barra de telemetría con datos reales del mock, que seleccionar otra tarjeta cambia la telemetría, que los dos "Ver Detalles" navegan al viaje correcto, y que el tema oscuro cambia los colores sin tocar ningún componente — el mismo criterio que ya cubre `e2e/panel.spec.ts`.
- Se corrieron `pnpm typecheck`, `pnpm lint` y la suite e2e nueva: todo en verde. `pnpm test` tiene dos fallos preexistentes sin relación con este trabajo (`tests/panel/formatEta.test.ts` y `tests/panel/NotificacionesCard.test.tsx`), verificados sin diferencias en esos archivos.
- Limpieza: se eliminó `test-results/.last-run.json`, el único artefacto que generaron las corridas de Playwright de esta tarea. No se generaron capturas ni trazas porque ninguna prueba falló.
- Los cambios quedan en el árbol de trabajo, sin commitear, a la espera de revisión.

**Archivos modificados:**

- `src/lib/contracts/panel.ts`
- `src/lib/contracts/index.ts`
- `src/lib/panel/parsePanel.ts`
- `src/mocks/data.ts`
- `src/routes/_private/seguimiento/index.tsx`
- `src/features/seguimiento/SeguimientoSection.tsx`
- `src/features/seguimiento/EstadoSeguimientoBadge.tsx`
- `src/features/seguimiento/ProgresoBar.tsx`
- `src/features/seguimiento/rutaAccent.ts`
- `src/features/seguimiento/ViajeActivoCard.tsx`
- `src/features/seguimiento/ViajesActivosCard.tsx`
- `src/features/seguimiento/TelemetriaExtraCard.tsx`
- `tests/fixtures/panelWire.ts`
- `tests/panel/parsePanel.test.ts`
- `tests/panel/ViajesEnCursoTable.test.tsx`
- `tests/panel/PanelSection.test.tsx`
- `tests/seguimiento/ViajeActivoCard.test.tsx`
- `tests/seguimiento/SeguimientoSection.test.tsx`
- `tests/seguimiento/SeguimientoSection.layout.test.tsx`
- `tests/seguimiento/TelemetriaExtraCard.test.tsx`
- `e2e/seguimiento.spec.ts`
- `README.md`
- `CHANGELOG.md`

## 2026:09:09 13:32

**Resumen:** Cierre del Panel de Control: verificación completa, corrección del barrido de colores para que compile con tipos estrictos y limpieza de artefactos.

**Cambios:**

- Se cambió la lectura de fuentes del barrido de colores de `node:fs` a `import.meta.glob` de Vite. `tests/` se compila con el proyecto de la aplicación, que no tiene tipos de Node, y añadirlos habría dejado entrar los globales de Node en el código de la app: peor remedio que enfermedad. El comodín del directorio se conserva, así que un componente nuevo del panel sigue entrando en el barrido sin tocar ninguna lista.
- Se añadió una prueba de que el comodín resuelve al menos siete archivos. Sin ella, si el patrón dejara de encontrar nada el barrido pasaría en verde sin revisar absolutamente nada.
- Verificación final: verificación de tipos sin errores, lint sin avisos, 12 archivos y 92 pruebas unitarias en verde, y la especificación del panel en Playwright con sus 10 casos en verde. No se ejecutó la suite e2e completa, según lo acordado.
- Se formateó `CHANGELOG.md` con Prettier. El resto del repositorio se dejó sin reformatear: `pnpm format:check` falla en 96 archivos por una causa anterior a este trabajo, `core.autocrlf=true` deja CRLF en el árbol y Prettier espera LF.
- Limpieza: se eliminó `test-results/`, que solo contenía el marcador `.last-run.json` de Playwright. No se generaron capturas, vídeos ni trazas, y no queda ningún `.png` nuevo fuera de `src/app/assets/`. El script temporal que se usó para medir contraste ya se había borrado en su propia tarea.
- Los cambios quedan en el árbol de trabajo de la rama `feat/control-panel`, sin commitear, a la espera de revisión.

**Archivos modificados:**

- `tests/panel/PanelSection.test.tsx`
- `CHANGELOG.md`

## 2026:09:09 13:24

**Resumen:** Se verificó el panel en los tres tamaños y en tema oscuro con Playwright, se añadió la prueba unitaria de layout y disciplina de color, y se corrigió el ayudante de login de e2e que estaba roto.

**Cambios:**

- Se agregó `tests/panel/PanelSection.test.tsx` con 20 casos. Mira clases a propósito y el archivo explica por qué: jsdom no aplica media queries, así que la única forma de afirmar en una prueba unitaria que el grid cambia por breakpoint es comprobar que las clases están puestas.
- El barrido de colores crudos recorre los doce archivos del panel más las primitivas migradas y falla si aparece una escala de Tailwind o un color literal. La lista de archivos del panel se construye leyendo el directorio, así que un componente nuevo entra en el barrido sin que nadie lo añada.
- `degradado-*` queda fuera de la lista de prohibidos: es un rol propio del sistema con paridad claro/oscuro, igual que `sidebar`, y no una escala cruda.
- Se agregó una prueba de que la tabla precede al mapa y a las notificaciones en el orden del DOM. Si alguien recolocara con `order-*`, lo que se ve y lo que se lee dejarían de coincidir y la comparación de posición lo detecta.
- Se creó `e2e/panel.spec.ts` con 10 casos, todos en verde: contenido de los indicadores, las tres verdades del ETA, chips reflejando la condición activa, el máximo de 28 caracteres medido sobre la columna real, las dos acciones, el grid en 375 / 768 / 1440 leyendo `gridTemplateColumns` ya calculado por el navegador, el scroll horizontal de la tabla en móvil, el mapa debajo en móvil y al lado en escritorio, y el tema oscuro.
- La prueba de tema oscuro añade la clase `dark` al `<html>` y comprueba que cambian el fondo del `body` y el del chip de estado. Es la verificación de que el panel consume roles: un chip escrito con un verde crudo no cambiaría.
- Se corrigió `e2e/support/login.ts`, que estaba roto en esta rama desde antes de este trabajo. El rediseño del login añadió el botón "Mostrar contrasena", y `getByLabel` casa por subcadena, así que `getByLabel('Contrasena')` resolvía dos elementos y fallaba en modo estricto. Con `exact: true` resuelve solo el campo. Afectaba a todos los recorridos e2e, no solo a los nuevos.
- Se aplicó la misma corrección en el caso de credenciales incorrectas de `e2e/journey.spec.ts`.
- En la prueba de "Solicitar Servicio" el localizador se acotó a la tarjeta de acciones: la sidebar tiene su propio enlace con el mismo nombre. Que existan los dos es correcto —uno es navegación permanente y el otro la acción del panel—, así que lo que se corrigió fue la prueba.
- Playwright no dejó capturas ni trazas: se verificó que `test-results` y `playwright-report` quedan vacíos.

**Archivos modificados:**

- `tests/panel/PanelSection.test.tsx`
- `e2e/panel.spec.ts`
- `e2e/support/login.ts`
- `e2e/journey.spec.ts`
- `CHANGELOG.md`

## 2026:09:09 13:15

**Resumen:** Se compuso el Panel de Control completo y se cableó como home autenticada, sustituyendo la lista plana de viajes que había antes.

**Cambios:**

- Se creó `features/panel/PanelSection.tsx`, presentacional: recibe el panel por props y no llama a la API. Compone los tres indicadores, las acciones, la tabla, el mapa y las notificaciones.
- Los indicadores van de 1 a 2 a 4 columnas. Cuatro tarjetas en fila necesitan unos 1200px para que el número grande no compita con la etiqueta; por debajo van de dos en dos y en móvil se apilan.
- El cuerpo se apila por debajo de `xl` y pasa a 2/3 + 1/3 en `xl`. La tabla va primera en el DOM porque es el contenido principal, y ese orden es también el de lectura en móvil: no se reordena con `order-*`, que separa lo que se ve de lo que se lee.
- El indicador de alertas cambia de tono según el dato: en rojo con "Requieren atención inmediata" cuando hay alguna, en neutro con "Sin alertas pendientes" cuando no. Un cero en rojo seguiría gritando sin motivo.
- La variación de viajes activos se muestra con signo explícito ("+3 desde ayer"): sin él, el número se leería como un total en lugar de como una variación.
- Un nivel de riesgo sin etiqueta conocida se muestra con su código crudo, igual que hace el chip de estado con los estados desconocidos.
- Se reescribió `routes/_private/index.tsx`: `loader` con `getPanel()`, `pendingComponent` con el spinner y `errorComponent` con el estado de error, más el `h1` "Panel de Control". Sin cabecera compartida y sin tocar `AppShell`.
- Se conserva el `h1` aunque el diseño no muestre título de página: sin él la jerarquía del documento empezaría en `h2`. Va visible, y confirma en el contenido lo que la sidebar marca como activo.
- Se corrigió `e2e/support/login.ts`, que esperaba el encabezado "Tus viajes" de la home anterior. Sin este cambio todos los recorridos e2e se habrían quedado colgados en el login, no solo el de la home.
- Se actualizó el aserto de `e2e/journey.spec.ts` para que compruebe el panel: además de las tres filas, que el bloque "Viajes en Curso" es visible.
- `ViajesListSection` sigue en uso en `/viajes`: el panel muestra solo los viajes en curso, que es una vista distinta y no una versión recortada del listado.

**Archivos modificados:**

- `src/features/panel/PanelSection.tsx`
- `src/routes/_private/index.tsx`
- `e2e/support/login.ts`
- `e2e/journey.spec.ts`
- `CHANGELOG.md`

## 2026:09:09 13:10

**Resumen:** Se agregaron la tarjeta de notificaciones recientes y el placeholder del mapa, con la severidad distinguible por algo más que el color.

**Cambios:**

- Se creó `features/panel/NotificacionesCard.tsx`. La severidad se comunica por tres vías a la vez: icono, texto oculto para lectores de pantalla ("Crítica:", "Informativa:") y color. El color solo no basta porque se pierde en escala de grises, en alto contraste y para una parte de la población.
- La lista es una `<ul>` real, así que un lector de pantalla anuncia cuántos avisos hay antes de leerlos: convierte "hay avisos" en "hay dos avisos".
- Una severidad desconocida se pinta en tono neutro y se anuncia como "Aviso", en lugar de caer en el estilo informativo. Disfrazarla de informativa sería decidir por el backend que algo no es grave.
- El tiempo se muestra relativo ("hace 2 minutos") dentro de un `<time>` con `dateTime`, y la fecha legible completa queda en el `title`: lo útil de un vistazo sin perder el instante real.
- Se creó `features/panel/MapPlaceholderCard.tsx` como hueco declarado y no como mapa a medio hacer. MapLibre sigue sin montar por la decisión abierta 9 del README: antes de dibujar hay que decidir cómo se pinta una posición vieja, qué se pinta cuando falta por degradación y si la traza es polilínea o puntos.
- El placeholder lleva texto además del icono. Un icono solo sería un cuadro vacío para quien usa un lector de pantalla, así que el hueco se calla en lo visual pero lo dice con palabras.
- Se agregaron 6 pruebas en `tests/panel/NotificacionesCard.test.tsx`, incluida la que falla si alguien sustituye el icono y el texto oculto por un simple cambio de fondo.

**Archivos modificados:**

- `src/features/panel/NotificacionesCard.tsx`
- `src/features/panel/MapPlaceholderCard.tsx`
- `tests/panel/NotificacionesCard.test.tsx`
- `CHANGELOG.md`

## 2026:09:09 13:06

**Resumen:** Se agregó la tabla "Viajes en Curso" con el chip de estado, la celda de ETA truncada y las utilidades de formato que necesitan.

**Cambios:**

- Se agregó `ETA_MAX_CHARS = 28` a `lib/constants.ts`. No es un número redondo: es la longitud exacta del peor caso del formato pedido, "24 de septiembre 2026, 12:00", con el nombre de mes más largo en español. Elegido así, el límite no corta nunca un ETA bien formado; solo recorta lo que se sale de la plantilla.
- Se agregaron `truncate` y `formatRelativeTime` a `lib/utils.ts`. En `truncate` la elipsis cuenta dentro del límite, porque el límite describe el ancho que la celda puede mostrar, y se limpian los espacios finales para no producir "Hoy a las …".
- Se creó `lib/tracking/formatEta.ts` con `formatEtaTexto`. Vive en el dominio de seguimiento y no en el panel porque la pantalla de tracking necesitará el mismo formato, y dos formatos para el mismo dato es como empiezan las pantallas que no se parecen entre sí.
- "Hoy" y "Mañana" se deciden por día de calendario y no por diferencia de horas: un ETA a trece horas cae hoy o mañana según cuándo se mire, y decir "Hoy" porque faltan menos de veinticuatro horas sería afirmar algo falso sobre el día. `ahora` es un parámetro, así que la función es pura y las pruebas no dependen del día en que se ejecuten.
- Se creó `features/viajes/EstadoViajeChip.tsx`, que no inventa estados. Deriva su apariencia de lo que existe: condición activa presente da tono de aviso y la etiqueta es la condición; `EN_RUTA` limpio da tono de éxito; `SOLICITADO`, informativo; cualquier otro código se pinta tal cual en gris. Los tres tonos del diseño salen sin declarar códigos que el contrato no tiene.
- Que la condición gane al estado no es estético: una condición activa se superpone al estado de progreso, y en una fila de una línea la anomalía es lo que hay que ver antes.
- Se creó `features/panel/EtaCell.tsx` con los tres estados de `Fresco`: hora formateada, "ETA no disponible" con `role="status"` y motivo en el `title`, o "Pendiente". No reutiliza `FreshnessMark` porque esa marca ocupa tres líneas y rompe el ritmo de la tabla, pero mantiene la distinción: "Pendiente" es un viaje sin ETA calculado y "ETA no disponible" es un ETA que existe y no podemos consultar.
- Se creó `features/panel/ViajesEnCursoTable.tsx` con su tarjeta, el título y el enlace inerte "Ver todos". Origen y destino comparten columna porque son una sola unidad de información y separarlos ensancharía la tabla justo donde menos ancho hay.
- Se ampliaron las props opcionales de `components/ui/Table.tsx`: `headerTone` para cabecera atenuada en tablas dentro de una tarjeta (evita dos marcos anidados), `rowAccent` para el indicador vertical de la fila destacada, y `minWidthClass` para que la tabla scrollee en lugar de comprimir columnas. El indicador va en la primera celda y no en el `<tr>` porque el borde en la fila no se pinta igual en todos los navegadores.
- Se agregaron 23 pruebas nuevas en `tests/panel/formatEta.test.ts`, y `tests/panel/ViajesEnCursoTable.test.tsx`, incluidas las que fijan el peor caso del formato en el límite exacto y la que verifica que un estado desconocido se muestra sin disfrazarse.
- Se amplió el helper `tests/support/router.tsx` con la ruta de detalle de viaje, que la tabla enlaza.

**Archivos modificados:**

- `src/lib/constants.ts`
- `src/lib/utils.ts`
- `src/lib/tracking/formatEta.ts`
- `src/components/ui/Table.tsx`
- `src/features/viajes/EstadoViajeChip.tsx`
- `src/features/panel/EtaCell.tsx`
- `src/features/panel/ViajesEnCursoTable.tsx`
- `tests/panel/formatEta.test.ts`
- `tests/panel/ViajesEnCursoTable.test.tsx`
- `tests/support/router.tsx`
- `CHANGELOG.md`

## 2026:09:09 13:00

**Resumen:** Se agregaron las tarjetas de indicador del panel y el bloque de acciones, con "Solicitar Servicio" navegando a la página de solicitud.

**Cambios:**

- Se creó `features/panel/KpiCard.tsx`. El valor es un nodo y no un texto porque los tres indicadores del diseño no tienen la misma forma (un número, un texto en dos líneas, un contador), y forzarlos a un tipo común obligaría a la tarjeta a interpretar el dato. El tono cambia el color del valor, del pie y del icono, nunca el fondo: la jerarquía la da el dato.
- La etiqueta del indicador va en su propio elemento de texto para que un lector de pantalla la lea separada del valor, y el icono se pasa siempre con `aria-hidden` porque la etiqueta ya nombra el indicador.
- Se creó `features/panel/QuickActionsCard.tsx`. "Solicitar Servicio" es un `Link` a `/viajes/new` y no un botón con `onClick`: es una navegación, así que debe poder abrirse en otra pestaña y mostrar su destino.
- "Descargar Reporte" queda visible y habilitado, sin handler y con un `TODO`. No se deshabilita porque un botón deshabilitado comunica "no puedes ahora" y lo cierto es "esto todavía no se ha construido".
- Se agregó `tests/support/router.tsx`, que monta un router de memoria para poder probar componentes con `Link`. Es la alternativa honesta a simular el `Link`: comprueba que el destino resuelve a un `href` real en lugar de comprobar que le pasamos una prop.
- Se agregó `tests/panel/KpiCard.test.tsx` con cinco casos: etiqueta, valor y pie legibles, icono no anunciado, valor de varias líneas, enlace de solicitud y botón de reporte operable.
- Nota de entorno: `pnpm format:check` falla en todo el repositorio por una causa anterior a este trabajo (`core.autocrlf=true` deja CRLF en el árbol y Prettier espera LF). Los archivos de esta tarea se verificaron con Prettier ignorando el fin de línea, sin reformatear los 96 archivos ajenos.

**Archivos modificados:**

- `src/features/panel/KpiCard.tsx`
- `src/features/panel/QuickActionsCard.tsx`
- `tests/support/router.tsx`
- `tests/panel/KpiCard.test.tsx`
- `CHANGELOG.md`

## 2026:09:09 12:56

**Resumen:** Se agregó la ruta de datos del Panel de Control: tipos de contrato, parser propio, wrapper de API y respuesta simulada, con los lectores de wire extraídos para no duplicar la lógica de frescura.

**Cambios:**

- Se creó `lib/wire/readers.ts` con los lectores estructurales del wire (`isRecord`, `requireString`, `requireNumber`, `requireRecord`, `optionalNumber`) y con `parseFrescoWire`, que es donde se cumple la regla "ausente por degradación no es ausente". Se extrajo en lugar de copiarse: si cada parser tuviera su propia versión, la regla se cumpliría dos veces y se rompería una.
- Se refactorizó `lib/tracking/parseTrackingPayload.ts` para consumir esos lectores y se exportaron `parseEtaWire`, `parsePosicionWire` y `parseCondicionesWire` para que el panel reutilice las mismas formas. El parser traduce los fallos de `lib/wire/` a `TrackingPayloadError`, así que su error público no cambia y las pruebas de contrato existentes siguen valiendo.
- Se creó `lib/contracts/panel.ts` con `PanelDeControl`, `ViajeEnCurso`, `NotificacionPanel` y los indicadores. El ETA de un viaje en curso es `Fresco<Eta>` y no `Eta | null`: "no lo sabemos ahora" y "no hay ETA" son casos distintos. `NivelRiesgo` y `SeveridadNotificacion` son uniones abiertas como `EstadoViaje`, porque el contrato de estados todavía no existe.
- Se creó `lib/panel/parsePanel.ts`, que no rellena huecos: si falta un indicador levanta `PanelPayloadError` en lugar de asumir un cero, porque "no hay viajes activos" es una afirmación que el panel no puede hacer cuando el campo no llegó.
- Se creó `lib/api/panel.ts` con `getPanel()`: un solo GET agregado a `/panel`, sin identificador de cliente en la petición, porque el alcance lo deriva el servidor del token.
- Se agregó `panelWire()` a los mocks como función y no como constante, para que los tiempos relativos ("Hoy, 18:30", "hace 2 minutos") se calculen al servir y la pantalla no envejezca sola. Reutiliza los folios, orígenes y destinos de `viajesWire`.
- El ETA de `viaje-2` llega marcado como ausente por degradación, coherente con su ruta de tracking: pintarle una hora concreta habría contradicho el propio dataset. `viaje-3` llega sin ETA. Los tres estados de `Fresco` quedan cubiertos.
- Se agregó el handler `GET /api/v1/panel` y las pruebas `tests/panel/parsePanel.test.ts`, incluida una que hace pasar el dataset de los mocks por el parser real, de modo que un renombre de campo falle en la suite y no al abrir el navegador.

**Archivos modificados:**

- `src/lib/wire/readers.ts`
- `src/lib/tracking/parseTrackingPayload.ts`
- `src/lib/contracts/panel.ts`
- `src/lib/contracts/index.ts`
- `src/lib/panel/parsePanel.ts`
- `src/lib/api/panel.ts`
- `src/mocks/data.ts`
- `src/mocks/handlers.ts`
- `tests/fixtures/panelWire.ts`
- `tests/panel/parsePanel.test.ts`
- `CHANGELOG.md`

## 2026:09:09 12:52

**Resumen:** Se agregaron los roles de color de estado (`success`, `warning`, `info`) en ambos temas, se creó la primitiva `Card` y se migraron `Button` y `Table` a roles Material 3 para que respondan al tema oscuro.

**Cambios:**

- Se agregaron doce tokens de color en `@theme` y en `.dark`: par sólido (`success` + `on-success`) y par suave (`success-container` + `on-success-container`) para cada uno de los tres estados. El par sólido es para puntos, bordes e iconos; el suave, para el relleno de chips y avisos.
- Se documentó el uso de los roles nuevos en la guía de la cabecera de `globals.css`, incluida la advertencia de que `warning` (aviso del dominio) no sustituye a `degradado` (el servicio no responde).
- Se verificó el contraste de los dieciocho pares con un script temporal: todos los pares de texto quedan por encima de 4.5:1 y los puntos sólidos sobre relleno suave por encima de 3:1. `on-warning` en claro se oscureció de `L=0.24` a `L=0.22` porque el valor original se quedaba en 4.44:1, justo por debajo del mínimo AA.
- Se creó `components/ui/Card.tsx`: superficie, borde y radio de una tarjeta definidos en un solo sitio, con borde en lugar de sombra según el sistema de diseño, y sin padding propio para que cada tarjeta decida su ritmo interno.
- Se migraron `Button` y `Table` de colores crudos (`brand-*`, `slate-*`, `red-*`) a roles. El hover de las variantes sólidas usa opacidad del mismo rol y no un rol distinto: saltar a `primary-container` funciona en claro pero se rompe en oscuro, donde tanto el fondo como el texto quedarían oscuros.
- Efecto colateral aceptado: el botón del login y el enlace de `/viajes` pasan del azul `brand-600` al azul `primary` del sistema de diseño.

**Archivos modificados:**

- `src/styles/globals.css`
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Table.tsx`
- `CHANGELOG.md`

## 2026:09:08 17:12

**Resumen:** Se agregaron transiciones sutiles a la sidebar para mejorar la interacción, respetando la preferencia de movimiento reducido.

**Cambios:**

- Los enlaces de navegación ahora animan color, fondo y borde en hover/activo, con un ligero desplazamiento a la derecha en hover y un escalado del icono.
- Se reservó el espacio del borde izquierdo (`border-l-4 border-transparent`) en los enlaces inactivos para evitar el salto de layout al activarse y suavizar la transición del borde.
- El botón "Nuevo viaje" se eleva levemente en hover y su icono "plus" gira 90°.
- Todas las animaciones se desactivan con `motion-reduce` para respetar `prefers-reduced-motion`.

**Archivos modificados:**

- `src/app/shell/Sidebar.tsx`
- `CHANGELOG.md`

## 2026:09:08 16:39

**Resumen:** Se agregó un icono "plus" al botón "Nuevo viaje" de la sidebar y se limpió código sin uso.

**Cambios:**

- Se creó el icono `PlusIcon` (signo más simple) en el archivo de iconos.
- Se colocó el icono a la izquierda del texto en el botón "Nuevo viaje" de la sidebar.
- Se eliminó el import y la variable `useSession`/`logout` que ya no se usaban en la sidebar (quedaban del botón "Salir" retirado), evitando un warning de lint.

**Archivos modificados:**

- `src/components/ui/icons.tsx`
- `src/app/shell/Sidebar.tsx`
- `CHANGELOG.md`

## 2026:09:08 15:59

**Resumen:** Se corrigió el bug de la sidebar donde dos pestañas quedaban activas a la vez al navegar entre rutas con prefijo común.

**Cambios:**

- Se reemplazó el resaltado activo basado en `activeProps`/`activeOptions` por un cálculo propio del estado activo con `useRouterState`, que compara el pathname por segmentos.
- Se añadió el campo `exact` por item de navegación: las rutas que son prefijo de otra (`/` y `/viajes`) se controlan explícitamente.
- Se añadió la regla de que un item padre no-exact (ej. `/viajes`) no se activa cuando un item hijo exacto reclama la ruta (ej. `/viajes/new`), evitando el doble activo.
- Como beneficio adicional, el detalle de un viaje (`/viajes/$viajeId`) ahora resalta correctamente "Historial de Viajes".

**Archivos modificados:**

- `src/app/shell/Sidebar.tsx`
- `CHANGELOG.md`

## 2026:09:08 15:44

**Resumen:** Se agregó un icono de escudo a la izquierda del título "AI27" en la sidebar.

**Cambios:**

- Se creó el icono `ShieldIcon` (escudo con marca de verificación) en el archivo de iconos.
- Se colocó el escudo a la izquierda del bloque de marca "AI27 / Seguridad Logística" en la sidebar.

**Archivos modificados:**

- `src/components/ui/icons.tsx`
- `src/app/shell/Sidebar.tsx`
- `CHANGELOG.md`

## 2026:09:08 13:54

**Resumen:** Se corrigió el color de la sidebar para que coincida con el diseño (navy) en ambos temas, creando un rol de color dedicado.

**Cambios:**

- Se añadió el rol semántico propio `sidebar` / `on-sidebar` en `globals.css`, porque ningún rol M3 se mantiene navy en claro y oscuro a la vez. Valores tomados de la paleta: claro `#002266`, oscuro `#101828`.
- Se actualizó la sidebar para usar `bg-sidebar` / `text-on-sidebar`, reemplazando `primary-container` (que no daba el navy correcto en el tema claro).
- El estado activo de cada pestaña usa `primary` / `on-primary` como resalte azul sobre el navy.

**Archivos modificados:**

- `src/styles/globals.css`
- `src/app/shell/Sidebar.tsx`
- `CHANGELOG.md`

## 2026:09:08 13:51

**Resumen:** Se hizo consistente el color de la sidebar entre los temas claro y oscuro, corrigiendo roles de color incoherentes.

**Cambios:**

- Se cambió el fondo de la sidebar a `primary-container`, que se mantiene navy en claro y navy casi negro en oscuro (antes usaba `primary`, que se invertía a azul claro en el tema oscuro).
- Se corrigió el logo "AI27", que usaba `text-primary` (azul sobre azul, casi invisible) por `on-primary-container`.
- Se alineó todo el contenido de la sidebar (subtítulo, enlaces, hover, botón Salir, borde) al par `on-primary-container` para un contraste consistente sobre el fondo navy.
- El estado activo de cada pestaña ahora usa el par `primary` / `on-primary` como resalte.

**Archivos modificados:**

- `src/app/shell/Sidebar.tsx`
- `CHANGELOG.md`

## 2026:09:08 13:35

**Resumen:** Se convirtió la barra de navegación superior en una sidebar lateral izquierda con las pestañas del portal, y se agregaron páginas temporales para las rutas que aún no existen.

**Cambios:**

- Se transformó `AppShell` de una barra superior a un layout de dos columnas con sidebar fija a la izquierda.
- Se creó el componente `Sidebar` con las pestañas: Panel de Control, Seguimiento en Vivo, Historial de Viajes, Solicitar Servicio y Configuración, cada una con su icono.
- Se creó el archivo de iconos SVG inline usados por la sidebar.
- Se mapearon las pestañas a rutas existentes (`/`, `/viajes`, `/viajes/new`) y se crearon páginas temporales para las que faltaban (`/seguimiento`, `/configuracion`) que muestran solo un texto de "en construcción".
- La sidebar y las páginas usan los roles de color Material 3, por lo que respetan los temas claro y oscuro.

**Archivos modificados:**

- `src/app/shell/AppShell.tsx`
- `src/app/shell/Sidebar.tsx`
- `src/components/ui/icons.tsx`
- `src/routes/_private/seguimiento/index.tsx`
- `src/routes/_private/configuracion/index.tsx`
- `CHANGELOG.md`

## 2026:09:08 00:05

**Resumen:** Se amplió la regla de CHANGELOG para exigir un resumen y la lista de archivos modificados en cada entrada.

**Cambios:**

- Se agregaron las reglas 6 y 7 exigiendo un resumen de los cambios y la lista de archivos modificados.
- Se actualizó el formato y el ejemplo de cada entrada.

**Archivos modificados:**

- `.kiro/steering/changelog.md`
- `CHANGELOG.md`

## 2026:09:08 00:00

- Se creó el archivo CHANGELOG.md y la regla de steering que exige registrar cada cambio.
