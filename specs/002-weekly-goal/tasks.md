# Tareas 002 — Objetivo semanal de estudio

Spec: `specs/002-weekly-goal/spec.md` · Plan: `specs/002-weekly-goal/plan.md`

> **Regla de la constitución 4**: ninguna tarea de la Fase 4 en adelante empieza mientras haya tests en rojo. Las Fases 1 a 3 son las que crean y ponen en verde los tests.
> **Alcance**: el objetivo semanal y nada más. La reparación del almacenamiento heredado, la lista de sesiones que no se rompe y la verificación pesada están en `specs/003-resilient-session-list/`.
> **Tiempo estimado** en cada tarea. Ninguna pasa de 30 minutos. La suma son 270 minutos: 4 horas y media.

---

## Fase 1 — Lógica pura: la lectura defensiva

- [x] **T1. Crear `session-list-logic.js` con las reglas compartidas y `readSessionStore` · 30 min**
  - **Cubre:** constitución 1 y 3, RNF-4, RNF-5, RNF-6, RF-10.1, RF-10.2, RF-10.3, RF-10.4, RF-10.6
  - **Detalle:** fichero nuevo en inglés con la guarda `module.exports`, como `heatmap-logic.js`. Al principio, el enlace a las reglas compartidas de D2: en el navegador las toma **de `window` explícitamente** y bajo Node con `require`. Constante `STORE_STATUS`. No lee `localStorage`: recibe el texto.
  - **Hecho cuando:** existen tests para vacío (nulo, cadena vacía, cadena de espacios), ilegible (texto que no se parsea, objeto, número, texto) y lista con malformados; los tres estados devuelven lo que dice la spec, los malformados **se conservan** y el fichero no toca el DOM ni el almacenamiento.

---

## Fase 2 — Lógica pura: el objetivo y la semana

- [x] **T2. Crear `weekly-goal-logic.js` con `parseGoalInput` y `resolveGoal` · 25 min**
  - **Cubre:** RF-2.3, RF-2.4, RF-2.5, RF-2.6, RF-7.3, RF-7.7, RF-7.8
  - **Detalle:** mismo esquema que T1. Constantes `DEFAULT_GOAL_MINUTES`, `MIN_GOAL_MINUTES`, `MAX_GOAL_MINUTES`, `GOAL_STATE` y `GOAL_STORAGE_KEY`. Solo dígitos y nada de `parseInt`, por el motivo que da D6.
  - **Hecho cuando:** hay un test para cada una de las formas aceptadas ("30", " 30 ", "030", "1", "10080") y para cada una de las rechazadas (vacío, "0", "1e3", "+30", "30.0", "30,5", "30 min", "-30", "10081" y un número sin texto), y `resolveGoal` distingue los tres casos: sin guardado (30, sin aviso), guardado ilegible (30, con aviso) y guardado válido (su valor, sin aviso).

- [x] **T3. `weekStartIso` y `sumWeekMinutes` · 25 min**
  - **Cubre:** RF-1.1, RF-1.2, RF-1.3, RF-1.4, RF-1.5, RF-1.6, RF-1.7, RF-5.1, RF-5.5, RF-6.1, RF-6.2
  - **Detalle:** la semana empieza en lunes, se aplica la regla de validez compartida del mapa y no se usa nunca `new Date()` sin argumentos ni `toISOString()`.
  - **Hecho cuando:** hay tests para el lunes que cuenta, la semana anterior que no, el futuro que no, el domingo que cuenta los siete días, la lista sin sesiones válidas que da 0, las sesiones de 1440 y de 1441 minutos, una lista con un elemento `null` entre sesiones válidas, y varias sesiones del mismo día que suman.

- [x] **T4. `computeGoalProgress` y `buildWeeklyGoalView` · 25 min**
  - **Cubre:** RF-3.1, RF-3.2, RF-3.3, RF-3.5, RF-3.6, RF-3.7, RF-3.8, RF-4.1, RF-4.3, RF-4.4, RF-10.3, RF-10.5, criterio 10
  - **Detalle:** el modelo de vista es el de 3.4 del plan, con las mismas claves en inglés; `ratio` va de 0 a 1 y nunca sale.
  - **Hecho cuando:** hay tests para el estado en curso, el exacto, el superado y el objetivo que baja por debajo de los minutos ya registrados, y un test demuestra que subir el objetivo a mitad de semana hace retroceder la proporción con **todos** los minutos ya registrados incluidos.

---

## Fase 3 — Regresiones y puerta

- [x] **T5. Regresiones de fechas, puerta en verde y orden de carga · 25 min**
  - **Cubre:** constitución 4, RNF-5, RNF-6, y los criterios 2 y 4, y el bloque 7.3 del plan
  - **Detalle:** cambio de hora de verano de marzo y de octubre, 29 de febrero, paso de año y determinismo. Aquí también se dejan en `index.html` los scripts en el orden de 2.3 del plan: `heatmap-logic.js` primero, la lógica antes que la interfaz. **No se toca `heatmap-ui.js`.**
  - **Hecho cuando:** `node --test` termina sin fallos, ninguna prueba depende de la fecha del sistema, el mapa de calor sigue pasando sus 49 pruebas sin haberlo tocado, y la página carga sin errores con el orden nuevo de scripts.

---

## Fase 4 — Estructura y estilos

- [x] **T6. Bloque del objetivo en `index.html` y `styles.css` · 25 min**
  - **Cubre:** RF-8.1, RF-8.2, RF-8.3, RF-8.7, RNF-1, RNF-2, RNF-10, criterio 15
  - **Detalle:** el `stat` de "Esta semana" desaparece y en su lugar va el bloque del objetivo con la jerarquía de 5.2 del plan, **sin `aria-label` vacío**: el nombre accesible de la barra se escribe al pintar. La rejilla de estadísticas pasa a dos columnas con el objetivo en una fila propia a todo el ancho.
  - **Hecho cuando:** a 1280 px y a 375 px el bloque se ve completo sin desbordes, el mapa y el resto de la página no han cambiado de orden y no aparece ninguna sección nueva.

---

## Fase 5 — Interfaz

- [x] **T7. Pintar los estados del objetivo con los literales de RF-9.1, con arranque propio · 30 min**
  - **Cubre:** RF-2.10, RF-2.11, RF-3.1, RF-3.3, RF-3.4, RF-5.2, RF-9.1 a RF-9.5, RF-9.7, RF-10.3, RF-10.5, RF-10.7, RF-10.8, RF-10.9, RNF-2, RNF-3, criterios 11 y 22
  - **Detalle:** la interfaz no calcula: coloca cifras dentro de los literales y decide qué línea mostrar a partir del `state` que llega en el modelo de vista (D7). **El arranque propio va aquí** (D10): al cargarse el script, lee el almacenamiento con `readSessionStore` y pinta el bloque entero, sin esperar a `app.js`. El refresco posterior repinta el bloque entero por encima, nunca partes sueltas. El aviso de sesiones ilegibles se pinta en este bloque; el de no válidas no se pinta nunca aquí. El nombre accesible de la barra se compone al pintar, con el patrón `ariaFor()` del mapa.
  - **Hecho cuando:** con el objetivo por defecto, con objetivo confirmado en curso, con la meta cumplida, con el objetivo guardado ilegible y **con el almacenamiento de sesiones ilegible**, cada pantalla muestra exactamente los literales de la tabla de RF-9.1 y ningún otro texto; al cumplirse la meta desaparecen la comparación con el objetivo y la línea de minutos que faltan; **con el almacenamiento ilegible el bloque aparece con 0 minutos registrados, la barra vacía, el estado en curso y su aviso, aunque el resto de la página no llegue a pintarse** (RF-10.7), y **ningún error de consola procede del objetivo** (criterio 22); y tras un refresco posterior **no queda ningún rastro del pintado anterior** (RF-10.8).

- [x] **T8. Flujo de edición y persistencia del objetivo · 30 min**
  - **Cubre:** RF-2.1, RF-2.6, RF-2.7, RF-2.8, RF-2.9, RF-7.1, RF-7.4, RF-7.5, RF-8.4, RF-8.5, RF-8.6, RF-9.6, criterios 8 y 9
  - **Detalle:** "Cambiar objetivo" abre el formulario con el valor vigente y lleva el foco al campo; guardar valida con `parseGoalInput`; cancelar no deja rastro. La clave del objetivo es nueva e independiente, y **leerla no escribe nada**.
  - **Hecho cuando:** guardar un valor válido lo conserva al cerrar y reabrir; un valor no válido muestra el mensaje y no cambia nada; guardar por debajo de los minutos registrados se acepta sin diálogo; **Intro también guarda y ningún otro atajo**; cancelar no deja mensaje; y con el almacenamiento bloqueado se muestra el mensaje de error de guardado sin perder el objetivo vigente.

- [x] **T9. Enganche con `renderizar()` y cambio de semana · 25 min**
  - **Cubre:** RF-3.9, RF-3.10, RF-4.2, RF-4.5, RF-4.6, RF-4.7, RF-4.8, RF-5.1, RF-5.3, RF-10.8, RNF-5, RNF-12, **criterios 5 y 6**
  - **Detalle:** en `app.js` se tocan **exactamente dos líneas**: se quita la que pintaba la estadística "Esta semana" (su nodo ya no existe) y se añade `if (window.weeklyGoal) window.weeklyGoal.render();`. **No se borra `calcularMinutosSemana`**: queda sin uso y su borrado es de la spec 003. El arranque propio no necesita ninguna línea aquí porque ya se ejecuta en T7. En la interfaz, el reloj se relee al recuperar el foco de la pestaña y en cada cambio de sesión, **sin temporizador**.
  - **Hecho cuando:** al añadir, editar o borrar una sesión el objetivo se actualiza solo; una sesión editada hacia otra semana sale de la cuenta y otra hacia esta semana entra; **la línea que se quita y la que se añade son las dos únicas líneas cambiadas en `app.js`** (criterio 20), y `calcularMinutosSemana` sigue ahí sin usarse; **la cifra que se ve en pantalla es idéntica a la que está detrás del progreso**, con sesiones válidas y con no válidas (criterio 5); **con sesiones no válidas la cifra muestra menos que antes de esta funcionalidad** (criterio 6); y, con la aplicación abierta y sin tocar nada, al recuperar el foco tras el cambio de semana la vista salta a la semana nueva.

---

## Fase 6 — Verificación mínima y cierre

- [x] **T10. Verificación mínima en navegador, idioma y documentación · 30 min**
  - **Cubre:** RNF-1, RNF-9, RNF-10, RNF-11, RNF-12, y los criterios 1, 3, 4, 7, 12, 13, 14, 16, 17, 18, 19, 20 y 21
  - **Detalle:** con el MCP de Chrome DevTools, **con un almacenamiento legible y válido**, a 1280 px y a 375 px. El estado ilegible ya lo comprueba T7, porque con el arranque propio el bloque del objetivo se pinta igual: aquí solo se revisa la página completa.
  - **Hecho cuando:** la página se ve bien en las dos anchuras, el bloque del objetivo se ve completo y funciona en las dos, el flujo de edición funciona, los textos son los de RF-9.1 con "min" abreviado, el recorrido con teclado y el lector de pantalla funcionan, con la opción de movimiento reducido se usa igual de bien y la **consola no muestra errores**; **el almacenamiento de sesiones no ha cambiado en ningún momento** (criterio 13); **el idioma está revisado** (los ficheros de lógica, sus tests y los comentarios nuevos en inglés; los literales en español; en `app.js` exactamente dos líneas y sin traducir nada), y están actualizados `AGENTS.md`, `MEMORY.md` y la versión del pie de página.