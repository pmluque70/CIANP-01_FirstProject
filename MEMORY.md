# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya aporte.
## Estado actual
- **v1.9.0**: registrar, editar y borrar sesiones; racha actual, mejor racha, días del mes, mapa de calor y **objetivo semanal**.
- **Spec 001 (mapa de calor) y spec 002 (objetivo semanal) IMPLEMENTADAS.** La 003 (`specs/003-resilient-session-list/`) está escrita pero **sin QA**: lista robusta, lectura defensiva compartida y borrado de `calcularMinutosSemana`.
- Objetivo semanal: `weekly-goal-logic.js` (puro y probado), `weekly-goal-ui.js` (interfaz con arranque propio), `session-list-logic.js` (`readSessionStore`), bloque en la tarjeta de racha. 142 tests con `node --test`.
- Datos en localStorage: `diarioEstudio_sesiones` y `diarioEstudio_objetivo_semanal` (independientes).
## Decisiones (y por qué)
- **El código va en inglés, la interfaz en español. Es un pilar de la constitución (principio 6), no una preferencia.** Se aplica también a los tests, porque son código.
- `app.js` está en español y es **deuda conocida**: no se copia su estilo y no se traduce de paso. Migrarlo es una tarea propia.
- Hoy **no hay i18n**: los literales de pantalla se escriben en español directamente. Otros idiomas exigirían una spec nueva; hasta entonces no es deuda.
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- **Lógica pura separada de interfaz**, y `heatmap-logic.js` es la dueña de las reglas de fecha y de validez de sesión. Quien necesite esas reglas **enlaza** a ese fichero en vez de duplicarlas: dos copias divergirían sin que ninguna prueba lo detecte.
- **Dos scripts clásicos no pueden declarar el mismo `const` de nivel superior**: el segundo lanza `SyntaxError` y no se ejecuta. Por eso los enlaces se llaman `sharedRules` (lista) y `heatMapRules` (objetivo). **No los unifiques.**
- **La interfaz solo coloca cifras dentro de literales fijos** y decide qué línea mostrar a partir del `state` que devuelve la lógica. Nunca compara números por su cuenta.
- **"Vacío no es ilegible"**: con la lista vacía no hay aviso; con algo guardado que no se puede leer, sí. Un valor guardado que no es texto es ilegible, nunca vacío.
- **El nombre accesible de la barra se escribe al pintar**, hecho de los mismos literales que se ven, nunca un `aria-label` vacío en el HTML.
- **La meta cumplida no muestra ni el objetivo ni el exceso**: la línea que estaba en curso se retira y en su lugar va "Meta cumplida".
- **Un solo hueco de aviso** para los dos avisos ilegibles: si ambos aplican se escriben los dos. Esconder uno escondería un problema que el dato demuestra.
- **El valor por defecto nunca se persiste** (30 min): si se guardara, dejaría de poderse distinguir de un objetivo elegido. Leer no escribe nada.
- **El mensaje de error sobrevive a los repintados**: contesta a "por qué no se guardó", y el formulario abierto significa que la pregunta sigue sin responder. Solo lo limpian abrir, guardar bien o cancelar.
- Con **almacenamiento bloqueado** se avisa y el formulario sigue abierto: cerrarlo daría a entender que se guardó.
- Semana empieza en lunes. Sin temporizador: el reloj se relee al arrancar, al recuperar el foco y en cada cambio de sesión.
- Identificadores y clases del HTML/CSS en español (patrón heredado); el resto del código, en inglés.
- Fechas en hora local, en texto `AAAA-MM-DD`, comparadas como texto. Sesiones sin `id`. Borrar pide `confirm()`.
- Paleta naranja (#ff6b35) con tarjeta de racha oscura. Animaciones solo CSS, con `prefers-reduced-motion` respetado y `:hover` dentro de `@media (hover: hover)`.
## Aprendizajes y errores a evitar
- **Nunca afirmar algo sobre los datos del usuario que el dato no demuestra.** Regla que ya corrigió un fallo grave del mapa de calor.
- **Toda función de cálculo recibe "hoy" como parámetro.** Si depende de `new Date()` sin argumentos, no es testeable y la tarea está incompleta.
- **Un atributo `hidden` no gana a un `display` de autor**: cualquier regla con `display` anula el `hidden` del HTML. Repítela si el elemento puede llevar `display`.
- **La especificidad importa**: `input:focus` del estilo base empataba con `.objetivo-form input` y dejaba el campo con texto blanco sobre fondo blanco.
- Al delegar en subagentes, redacta el prompt en español y sin intercalar palabras de otro idioma: se les colaron tokens corruptos (`不属于`, `分钟`, `Lebensfahr`, `Codebase`...). **Barre el fichero al recogerlo, siempre.**
- Escribir documentos en UTF-8 introduce basura si no se vigila. Barrer tras escribir.
- `innerHTML = ''` recrea los `<li>`: para animarlos hay que animar el elemento.
- `resize_page` no baja de 500 px de viewport: para 375 px reales usa `emulate` con `viewport: "375x812x3,mobile,touch"`.
- El MCP de Chrome DevTools puede desaparecer entre turnos: si no está, dilo en vez de afirmar que lo has comprobado.
- Racha de días antiguos (28-30 de septiembre con hoy 2 de octubre) da racha actual 0 y mejor racha 3. Es correcto, no un bug.
## Pendiente
- **Spec 003**: QA, y luego lista que no se rompe, lectura compartida y borrar `calcularMinutosSemana` (y `minutosSemana`) de `app.js`.
- `calcularDiasMes` (`app.js:168`) llama a `s.fecha.startsWith(...)` sin guarda: **una sesión sin fecha rompe la lista entera**. Deuda heredada, de la spec 003.
- La tarjeta dice "1 días": el plural de la racha y de los días del mes es texto fijo en el HTML.
- Migrar `app.js` al inglés. `calcularRacha`, `calcularMejorRacha` y `calcularDiasMes` leen el reloj y no reciben "hoy", así que no son testeables.
- Spec de internacionalización, si algún día se quieren otros idiomas.