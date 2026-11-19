---
inclusion: always
---

# Steering: Componentes de la librería UI

Estas reglas aplican **siempre** que se cree, agregue o modifique un componente en este repositorio. Su propósito es que todos los componentes se vean y se comporten como parte de un mismo sistema de diseño, con una experiencia moderna y amigable.

## 1. Restricciones no negociables

- **No cambiar colores.** No modificar la paleta, los tokens de color ni introducir valores de color nuevos (hex, rgb, hsl) dentro de los componentes. Usar únicamente los colores existentes en el tema.
- **No cambiar fuentes.** No modificar familias tipográficas ni su carga. Solo se puede ajustar la escala de tamaños.
- **No romper la API pública.** Mantener props, nombres y exports existentes. Si un cambio la afecta, documentarlo y pedir validación.
- **No agregar dependencias** sin justificarlo explícitamente.

## 2. Qué sí se puede (y se debe) ajustar

- **Tamaños:** alturas, anchos mínimos, padding, márgenes, gaps, tamaño de iconos, escala de texto.
- **Formas:** border-radius, grosor de bordes, sombras y elevación.
- **Espaciado:** ritmo vertical y horizontal consistente.
- **Estados:** hover, focus, active, disabled, loading y error, siempre con feedback visual claro.
- **Transiciones:** sutiles y consistentes (misma duración y easing en todo el sistema).

## 3. Tokens compartidos (fuente única de verdad)

Todo valor de tamaño, forma o espaciado debe salir de los tokens centrales ubicados en: `src/styles/tokens.css`.

- Prohibido usar valores sueltos ("mágicos") como `padding: 13px` o `border-radius: 7px`.
- Si un valor necesario no existe, **agregarlo primero a los tokens** y luego consumirlo, en lugar de escribirlo directamente en el componente.
- Los tokens cubren como mínimo: escala de espaciado, radios, sombras, alturas de controles por tamaño (sm / md / lg) y escala de texto.

## 4. Coherencia entre componentes

- Los componentes de la misma familia comparten dimensiones: inputs, selects, botones y controles similares tienen la **misma altura por tamaño**.
- Mismo radio para elementos del mismo nivel jerárquico (controles, tarjetas, modales, etc.).
- Mismos estados con el mismo tratamiento visual en todos los componentes (foco, deshabilitado, error).
- Tamaños disponibles siempre con la misma nomenclatura (`sm`, `md`, `lg`).
- Antes de crear un componente nuevo, revisar los existentes y **reutilizar patrones y tokens**; no inventar un estilo propio.

## 5. UX/UI moderna y amigable

- Interfaces limpias, con espacio para respirar y jerarquía visual clara.
- Áreas de clic/toque cómodas (mínimo 40–44 px en controles interactivos).
- Feedback inmediato ante cada interacción (hover, press, loading, éxito, error).
- Mensajes de error y estados vacíos claros y útiles.
- Microinteracciones discretas; nunca animaciones que distraigan o retrasen la tarea.

## 6. Accesibilidad

- Foco visible en todo elemento interactivo.
- Navegación completa por teclado.
- Atributos ARIA y roles semánticos correctos.
- Contraste adecuado usando los colores ya existentes del tema.
- Respetar `prefers-reduced-motion` en animaciones y transiciones.

## 7. Flujo de trabajo obligatorio

Al crear o modificar un componente:

1. **Revisar** los componentes existentes y los tokens antes de escribir código.
2. **Implementar** consumiendo únicamente tokens compartidos.
3. **Verificar** que no cambió ningún color ni fuente, que la API pública se mantiene y que el componente compila y funciona.
4. **Actualizar** documentación, ejemplos o stories del componente.
5. **Reportar** brevemente qué se cambió y cualquier decisión que requiera validación.

## 8. Lista de verificación antes de dar por terminado

- [ ] No hay colores ni fuentes nuevos ni modificados.
- [ ] No hay valores de tamaño/forma fuera de los tokens.
- [ ] Coincide en altura, radio y espaciado con los componentes de su familia.
- [ ] Todos los estados están definidos (hover, focus, active, disabled, loading, error).
- [ ] Cumple los puntos de accesibilidad.
- [ ] La API pública no se rompió.
- [ ] Documentación o stories actualizados.
