# Tareas 003 — Lista de sesiones que no se rompe

Spec: `specs/003-resilient-session-list/spec.md` · Plan: `specs/003-resilient-session-list/plan.md`

> **Regla de la constitución 4**: ninguna tarea de la Fase 3 en adelante empieza mientras haya tests en rojo.
> **Premisa**: la spec 002 ya está aprobada y ya creó `session-list-logic.js`, `session-list.test.js` y `readSessionStore`. Aquí se amplía ese fichero y se repara el heredado.
> **Tiempo estimado** en cada tarea. Ninguna pasa de 30 minutos. La suma son unas tres horas y media.

---

## Fase 1 — Modelo de fila

- [ ] **T1. `buildSessionRow` y `formatDateEs` en `session-list-logic.js` · 30 min**
  - **Cubre:** RNF-4, RNF-6, RF-2.1, RF-2.2, RF-2.3, RF-2.4, RF-2.5, RF-2.6, RF-2.8, RF-4.1, criterios 2 y 8
  - **Detalle:** función pura con el pseudocódigo de 4.1 del plan. Constantes `ROW_KIND` y `ROW_TEXT` con los cuatro literales de RF-4.1. `formatDateEs` usa las mismas opciones que la función de fecha que ya existe en el fichero heredado, para que las filas normales no cambien de aspecto.
  - **Hecho cuando:** hay un test para `null`, número, texto y lista (los tres huecos con "Registro ilegible"), sin fecha, sin tema, con minutos cero, negativos, decimales, de texto y de 1441, con fecha y minutos válidos pero sin tema, y con `todayIso` futuro; además, un test fija que las cuatro cadenas son las de RF-4.1, otro que `formatDateEs` produce "2 oct 2026" y otro que la entrada recibida no cambia.

---

## Fase 2 — Puerta

- [ ] **T2. Regresiones de la lista y puerta en verde · 25 min**
  - **Cubre:** constitución 4, RNF-5, RNF-6, criterios 2, 3 y 4
  - **Detalle:** cambio de hora de verano de marzo y de octubre, 29 de febrero, paso de año, dos sesiones idénticas y determinismo. Ninguna prueba puede depender de la fecha del sistema.
  - **Hecho cuando:** `node --test` termina sin fallos en las tres specs, ninguna prueba depende de la fecha del sistema, y el mapa de calor sigue pasando sus pruebas sin haberlo tocado.

---

## Fase 3 — Reparación del fichero heredado

- [ ] **T3. Lectura delegada en `app.js`, una línea en `heatmap-ui.js` y una en `index.html` · 30 min**
  - **Cubre:** RNF-8, RF-1.1 a RF-1.6, RF-1.5, criterios 5, 6 y 12
  - **Detalle:** en el fichero heredado, `leerAlmacenamientoSesiones()` nueva llama a `readSessionStore` y guarda el estado; `cargarSesiones()` mantiene su firma, así que **ningún llamante existente cambia**, y el ordenamiento deja de poder fallar. En el mapa, una línea: su lectura local pasa a ser la compartida. En el HTML, insertar el script de lógica antes de la interfaz del mapa. Todo en español, dentro de la excepción declarada.
  - **Hecho cuando:** con un texto guardado que no se puede interpretar, o con un valor que no es una lista, la página **se pinta entera y la consola no muestra errores**; **la rejilla del mapa sigue pintándose y su aviso sigue igual**; y en el código **no queda ninguna otra lectura del almacenamiento** aparte de la compartida.

- [ ] **T4. La lista se pinta con el modelo de fila · 30 min**
  - **Cubre:** RF-2.1 a RF-2.9, RNF-1, RNF-2, RNF-3, RNF-9, criterios 7, 8, 9, 10 y 11
  - **Detalle:** el bucle de pintado deja de leer campos a ciegas y pide `buildSessionRow`. Los estilos no cambian: solo que los textos sustituto lleven el tono apagado que ya usa la etiqueta de fecha, para distinguirse de un dato real sin depender del color.
  - **Hecho cuando:** con una lista que mezcla entradas malformadas y sesiones válidas, la página se pinta entera, **las válidas siguen pintándose y contando**, los cuatro huecos muestran su texto sustituto, y la consola no muestra errores; una entrada con fecha y minutos válidos pero sin tema **cuenta** para el objetivo; una malformada se puede **borrar** desde la lista y al borrarla no desaparece ninguna otra; y al editar una malformada para completarla deja de estarlo.

- [ ] **T5. Borrar el código muerto · 20 min**
  - **Cubre:** RF-5.1, RF-5.2, RF-5.3, RNF-8, RNF-11, RNF-12, criterio 13
  - **Detalle:** eliminar `calcularMinutosSemana` del fichero heredado, **después de comprobar que ya no tiene ningún llamante** (la spec 002 quitó su llamada). No se traduce nada más.
  - **Hecho cuando:** la función ha desaparecido del fichero, la aplicación se comporta exactamente igual, y no se ha traducido ningún otro identificador ni comentario.

---

## Fase 4 — Verificación

- [ ] **T6. Verificación en navegador de los tres estados del almacenamiento · 30 min**
  - **Cubre:** RNF-1, RNF-8, RNF-9, y los criterios 5, 6, 7, 10, 11 y 12
  - **Detalle:** con el MCP de Chrome DevTools, a 1280 píxeles y a 375 píxeles, en los tres estados (legible, lista con malformados e ilegible). Los datos se preparan en DevTools → Application → Local Storage.
  - **Hecho cuando:** en los tres estados la consola está limpia y la página se pinta entera; la lista se ve bien a 375 píxeles, con sus textos sustituto distinguibles de los datos reales; el aviso de registros ignorados es **solo el del mapa**, sin duplicados; y ninguna sesión guardada ha desaparecido ni cambiado de formato.

- [ ] **T7. Teclado, rendimiento e idioma · 30 min**
  - **Cubre:** RNF-2, RNF-3, RNF-5, RNF-7, RNF-10, RNF-11, RNF-12, y los criterios 1, 8, 13, 14, 15, 16 y 17
  - **Detalle:** **revisión final contra la spec** fila por fila de RF-1 a RF-5, recorrido con teclado de una fila malformada, medición con 2000 sesiones, revisión del idioma y cierre documental.
  - **Hecho cuando:** los 17 criterios de la sección 10 se pueden señalar uno por uno en el código; los botones de editar y borrar de una fila malformada son operables con teclado y se anuncian a un lector de pantalla; con 2000 sesiones el pintado no tarda más que antes de esta spec; con la opción de movimiento reducido activada se usa igual de bien; el código nuevo está en inglés y los tres cambios del fichero heredado en español, dentro de la excepción declarada; y están actualizados `AGENTS.md`, `MEMORY.md` y la versión del pie de página.