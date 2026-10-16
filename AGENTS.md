# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a programar.
## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos heredada, en español), `favicon.svg` (icono del sitio).
- Funcionalidades nuevas: lógica pura y probada en un fichero (`*-logic.js`), interfaz en otro (`*-ui.js`). Hoy hay `heatmap-*`, `session-list-logic.js` y `weekly-goal-*`.
- Orden de carga en `index.html`: primero la lógica pura, luego las interfaces y `app.js` al final. Cada lógica lee de `heatmap-logic.js` al cargarse, así que ese va primero.
- **Cuidado**: dos scripts clásicos no pueden declarar el mismo `const` de nivel superior (sale `SyntaxError` y ese script no se ejecuta). Por eso los enlaces a las reglas del mapa se llaman distinto en cada fichero.
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.
## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
- Paleta de color: naranja (#ff6b35 como color principal), con tarjeta de racha oscura como punto focal.
- Animaciones CSS solo: respeta `prefers-reduced-motion` y usa `:active` (no solo `:hover`) para que funcione en móvil.
## Datos
- localStorage, clave `diarioEstudio_sesiones`: array de `{ fecha: "AAAA-MM-DD", tema, minutos }`.
- localStorage, clave `diarioEstudio_objetivo_semanal`: el objetivo semanal en minutos, como texto. Es independiente de las sesiones.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario perderá sus sesiones.
## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha actual = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Ejemplo: con sesiones el 28, 29 y 30 de septiembre y hoy siendo el 2 de octubre, la racha actual es 0 (no hubo sesión ni ayer) pero la mejor racha es 3. Para que la racha actual no se rompa, tiene que haber sesión hoy o ayer.
- Mejor racha = la secuencia más larga de días consecutivos con sesión en toda la historia. Se calcula recorriendo las fechas únicas ordenadas.
- Minutos semanales = suma de minutos de las sesiones **válidas** desde el lunes hasta hoy (las futuras no suman). Usa la misma regla de validez que el mapa de calor: cero minutos, negativos, decimales, más de 1440 o sin fecha no cuentan. Por eso la cifra puede mostrar **menos** que antes.
- Días del mes = número de días únicos con al menos 1 sesión en el mes actual, sin contar fechas futuras.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- Mientras no existan tests (ver *Estado de las pruebas*), verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `diarioEstudio_sesiones`.
## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).
## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
- **Idioma (pilar, constitución 6): el código se escribe en inglés y la interfaz en español.** Aplica a identificadores, funciones, variables, constantes, ficheros, comentarios y tests.
- **`app.js` está en español y es deuda.** No copies su estilo al añadir código nuevo. No lo traduzcas de paso: la migración es una tarea propia.
- Los literales de la pantalla se escriben en español directamente. Hoy no hay i18n y no se está planeando en esta spec; cuando se quiera otros idiomas hará falta una spec nueva.
- **Toda función de cálculo recibe "hoy" como parámetro** y jamás lee el reloj del sistema con `new Date()` sin argumentos. Si una función depende de la fecha actual, no es testeable y la tarea está incompleta.
- Los tests pasan la fecha explícitamente. Una prueba que falla al cambiar la fecha del sistema es un bug, no un test frágil.
- La documentación, los planes y las specs, en español, con la misma terminología que la interfaz.
## Comandos
- Tests: `node --test`
- Verificación en navegador: MCP `chrome-devtools` (abrir `index.html`, probar, revisar consola, comprobar vista móvil)
## Estado de las pruebas
- No hay todavía ningún fichero de test en el repositorio. `node --test` no encuentra nada que ejecutar.
- La primera spec que los exige es la 001 (mapa de calor). Hasta que existan tests, el criterio "tests en rojo" no se puede evaluar.
