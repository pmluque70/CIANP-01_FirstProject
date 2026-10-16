# Tareas 001 — Mapa de calor de estudio

Spec: `specs/001-heat-map/spec.md` · Plan: `specs/001-heat-map/plan.md`

> **Regla de la constitución 4**: ninguna tarea de la Fase 5 en adelante empieza mientras haya tests en rojo. Las Fases 1 a 4 son las que crean los tests.

---

## Fase 0 — Preparación

- [ ] **T0.1** Fotografiar el estado actual de la aplicación
  - **Cubre:** ninguno (referencia previa)
  - **Hecho cuando:** he abierto `index.html` sin servidor y he anotado en un fichero los valores de racha, mejor racha, minutos de la semana y días del mes con una sesión de prueba conocida.

- [ ] **T0.2** Confirmar que `node --test` funciona y que hoy no encuentra tests
  - **Cubre:** RNF-4
  - **Hecho cuando:** he ejecutado `node --test` y la salida indica que no hay ficheros de prueba, que es el punto de partida.

---

## Fase 1 — Andamiaje para poder testear

- [ ] **T1.1** Crear `heatmap-logic.js` con la guarda de exportación y las utilidades de fecha
  - **Cubre:** constitución 1 y 3, RNF-5, RNF-3, RNF-3b
  - **Detalle:** un fichero con la guarda `module` al final que solo exporta cuando existe `module`, más las utilidades mínimas de fecha: convertir `"AAAA-MM-DD"` a fecha local, sumar días, día de la semana y lunes de la semana. Ninguna usa UTC ni `new Date()` sin argumentos.
  - **Hecho cuando:** el fichero existe, no toca el DOM ni el almacenamiento, y al abrirlo en el navegador no lanza ningún error en la consola.

- [ ] **T1.2** Crear `heatmap.test.js` y confirmar que Node lo descubre
  - **Cubre:** RNF-4
  - **Hecho cuando:** he ejecutado `node --test` y aparece el fichero en la salida, sin errores de módulo.

---

## Fase 2 — Funciones puras, una por tarea

- [ ] **T2.1** `isValidSession(sesion, todayIso)`
  - **Cubre:** RF-4.1, RF-4.2, RF-4.3, RF-2.1
  - **Hecho cuando:** hay tests para minutos cero, negativos, no numéricos, 1440, 1441, fecha de hoy, fecha futura y elemento que no es objeto, y todos pasan.

- [ ] **T2.2** `intensityLevel(minutos)`
  - **Cubre:** RF-2.2, RF-2.3, RF-3.1
  - **Detalle:** umbrales literales, no calculados a partir de los datos.
  - **Hecho cuando:** hay un test para cada valor de frontera (0, 1, 29, 30, 59, 60, 119, 120 y uno alto) y los nueve dan el nivel correcto.

- [ ] **T2.3** `sumMinutesByDate(sesiones, todayIso)`
  - **Cubre:** RF-2.1, RF-10.1
  - **Hecho cuando:** dos sesiones del mismo día validan la suma, una sesión descartada no suma, y el resultado no contiene ninguna fecha excluida.

- [ ] **T2.4** `countExcludedSessions(sesiones, todayIso)`
  - **Cubre:** RF-4.4, RF-4.5
  - **Hecho cuando:** devuelve 0 con un array vacío, cuenta bien una y varias exclusiones, y no lanza error con un elemento que no es objeto.

- [ ] **T2.5** `computeWindow(todayIso)`
  - **Cubre:** RF-1.2, RF-8.6, RF-9.6
  - **Hecho cuando:** devuelve el lunes de la semana actual y el lunes de 51 semanas antes, y hay test para cambio de año y para 29 de febrero.

- [ ] **T2.6** `parseRange(desdeIso, hastaIso)`
  - **Cubre:** RF-9.4, RF-9.5
  - **Hecho cuando:** devuelve rango con las dos fechas, devuelve nulo si falta una, y devuelve nulo si el final es anterior al inicio.

- [ ] **T2.7** `detailForDate(sesiones, fecha, todayIso)`
  - **Cubre:** RF-5.2, RF-5.3, RF-5.8, RF-5.9
  - **Detalle:** devuelve estado, minutos válidos y número de sesiones excluidas.
  - **Hecho cuando:** hay un test para los cuatro estados y el caso "solo descartados" **no** devuelve el estado de "no se estudió".

- [ ] **T2.8** `buildHeatMap(sesiones, todayIso, rango)`: estructura de rejilla
  - **Cubre:** RF-1.1, RF-1.3, RF-1.5
  - **Hecho cuando:** devuelve 52 columnas, cada una con 7 ranuras, las filas van de lunes a domingo, y un array vacío no rompe nada.

- [ ] **T2.9** `buildHeatMap`: ventana y días futuros
  - **Cubre:** RF-1.4, RF-2, RF-3.1, RF-3.2
  - **Hecho cuando:** no hay ninguna celda con fecha posterior a `todayIso`, la última columna queda incompleta, y las celdas anteriores a la primera sesión salen vacías.

- [ ] **T2.10** `buildHeatMap`: aplicación del filtro
  - **Cubre:** RF-9.3, RF-9.4, RF-9.5, RF-9.6, RF-9.7, RF-9.8
  - **Hecho cuando:** hay tests para rango válido, rango invertido, un solo campo, rango anterior a la ventana, rango en el futuro y rango de un solo día, y en todos los casos la rejilla conserva sus 7 filas.

- [ ] **T2.11** `monthLabelsFor(semanas)`
  - **Cubre:** RF-7.2, RF-7.3
  - **Hecho cuando:** hay un test con dos meses consecutivos, con un mes que ocupa varias columnas, y con dos etiquetas que no caben, y en este último caso la que no cabe se omite sin perder el orden.

- [ ] **T2.12** Comprobar que la lógica no muta la entrada
  - **Cubre:** RF-11.1, RNF-6
  - **Hecho cuando:** hay un test que pasa un array de sesiones, llama a `buildHeatMap` y comprueba que el array recibido es idéntico antes y después.

- [ ] **T2.13** Puerta de la constitución: todo en verde antes de seguir
  - **Cubre:** constitución 4, RNF-4
  - **Hecho cuando:** `node --test` termina sin fallos y sin pruebas pendientes.

---

## Fase 3 — Regresiones que no pueden faltar

- [ ] **T3.1** Cambio de hora de verano
  - **Cubre:** RF-1.3, RF-1.4
  - **Hecho cuando:** hay tests para el último domingo de marzo y el de octubre y ninguna celda se desplaza de fila ni de columna.

- [ ] **T3.2** Años bisiestos y cambio de año
  - **Cubre:** RF-1.2, RF-7.1
  - **Hecho cuando:** hay tests para el 29 de febrero y para el paso del 31 de diciembre al 1 de enero, con las etiquetas de mes correctas.

- [ ] **T3.3** Aritmética de los tramos
  - **Cubre:** RF-2.1, RF-2.2
  - **Hecho cuando:** un test demuestra que dos sesiones de 20 y 40 minutos del mismo día suman 60 y dan nivel 3, y otro con sesiones duplicadas idénticas demuestra que se cuentan todas.

- [ ] **T3.4** Determinismo
  - **Cubre:** RF-1.6, RNF-3b
  - **Hecho cuando:** hay un test que llama dos veces con la misma fecha y compara el resultado, y otro que demuestra que el resultado no cambia al alterar la fecha del sistema.

---

## Fase 4 — Estructura y estilos

- [ ] **T4.1** Sección del mapa en `index.html`
  - **Cubre:** RF-1.1, RF-7.1, RF-6.1
  - **Detalle:** insertada entre la tarjeta de racha y el formulario.
  - **Hecho cuando:** la sección aparece en el sitio correcto con su título, su rejilla vacía y su leyenda, y el resto de la página no se ha movido de orden.

- [ ] **T4.2** Campos del filtro en `index.html`
  - **Cubre:** RF-9.1, RF-9.2
  - **Hecho cuando:** hay dos campos de fecha, ambos vacíos, y una acción para retirar el filtro.

- [ ] **T4.3** Contenedor con desplazamiento y rejilla en CSS
  - **Cubre:** RF-8.1, RF-8.5, RNF-1, RNF-8
  - **Hecho cuando:** a 375 px las 52 columnas no caben en pantalla y se desplazan solo en horizontal sin bloquear el desplazamiento vertical de la página.

- [ ] **T4.4** Estilos de celda por nivel
  - **Cubre:** RF-2.2, RF-3.1, RNF-2
  - **Hecho cuando:** los cinco niveles se distinguen por color **y** por tono, y el nivel 0 se ve vacío.

- [ ] **T4.5** Estilos de leyenda y etiquetas de mes
  - **Cubre:** RF-6.1, RF-6.2, RF-7.1
  - **Hecho cuando:** la leyenda muestra las cinco entradas y las etiquetas de mes no se solapan entre sí.

- [ ] **T4.6** Estilos del panel de detalle y del aviso
  - **Cubre:** RF-5.5, RF-5.6, RF-4.4
  - **Hecho cuando:** el panel tiene estado vacío visible y el aviso de descartes no empuja ni oculta el contenido del mapa.

- [ ] **T4.7** Señales de borde y foco visible
  - **Cubre:** RF-8.3, RNF-2b
  - **Hecho cuando:** se ve una señal en el borde por el que queda contenido, y al navegar con el teclado se ve con claridad dónde está el foco.

---

## Fase 5 — Interfaz

- [ ] **T5.1** Leer las sesiones y pintar la rejilla vacía
  - **Cubre:** RF-1.1, RF-10.2
  - **Hecho cuando:** al abrir la página se pinta una rejilla de 52 por 7 con las celdas en nivel 0 y sin errores en la consola.

- [ ] **T5.2** Pintar las intensidades reales
  - **Cubre:** RF-2.1, RF-2.2, RF-3.1, RF-3.2, RF-10.1
  - **Hecho cuando:** con sesiones conocidas, cada día aparece con el color que le corresponde y el total por día coincide con lo que suma la lista de sesiones.

- [ ] **T5.3** Pintar etiquetas de mes y leyenda
  - **Cubre:** RF-6.1, RF-6.2, RF-7.1, RF-7.2, RF-7.3
  - **Hecho cuando:** los meses aparecen una vez cada uno, en orden, y la leyenda siempre muestra las cinco entradas.

- [ ] **T5.4** Detalle con el puntero
  - **Cubre:** RF-5.1, RF-5.2, RF-5.3, RF-5.4
  - **Hecho cuando:** al pasar el ratón por una celda aparece su fecha y sus minutos, y no hay ninguna forma de editar o borrar desde el mapa.

- [ ] **T5.5** Panel de detalle al tocar
  - **Cubre:** RF-5.5, RF-5.6, RF-5.7, RF-5.8, RF-5.9
  - **Detalle:** el texto sale del estado que devuelve la lógica, nunca de una condición escrita en la interfaz.
  - **Hecho cuando:** al tocar un día el panel muestra su detalle, al tocar otro cambia, y en un día con sesión descartada el texto **no** dice que no se estudió.

- [ ] **T5.6** Navegación con teclado y lectura de pantalla
  - **Cubre:** RNF-2b
  - **Hecho cuando:** la rejilla es un único punto de tabulación, las flechas recorren las celdas, y cada celda anuncia su fecha y sus minutos a un lector de pantalla.

- [ ] **T5.7** Posicionamiento inicial y señales de borde
  - **Cubre:** RF-8.2, RF-8.4, RF-8.6
  - **Hecho cuando:** al abrir la página se ve la zona de los días más recientes, y desplazándose hasta el extremo no aparecen días anteriores a la ventana.

- [ ] **T5.8** Filtro aplicado
  - **Cubre:** RF-9.3, RF-9.4, RF-9.5, RF-9.6, RF-9.7, RF-9.8
  - **Hecho cuando:** un rango válido acota la rejilla, uno invertido avisa sin cambiar la vista, uno con un solo campo no filtra y no avisa, y uno fuera de la ventana no muestra días anteriores a ella.

- [ ] **T5.9** Retirar el filtro
  - **Cubre:** RF-9.9
  - **Hecho cuando:** al retirar el filtro vuelve la rejilla completa y el desplazamiento se sitúa en los días más recientes.

- [ ] **T5.10** Aviso de sesiones descartadas
  - **Cubre:** RF-4.4, RF-4.5
  - **Hecho cuando:** con una sesión corrupta aparece el aviso indicando cuántas se han ignorado, y sin ninguna sesión descartada no aparece aviso.

---

## Fase 6 — Enganche con la aplicación

- [ ] **T6.1** Notificar el mapa desde `renderizar()`
  - **Cubre:** RF-10.2, RF-10.3, RF-11.3
  - **Detalle:** una sola llamada al final de `renderizar()` en `app.js`, que no debe hacer nada si el mapa no está en pantalla.
  - **Hecho cuando:** al añadir una sesión el mapa se actualiza solo, al editar una sesión cambiando su fecha desaparece del día viejo y aparece en el nuevo, y al borrarla desaparece.

---

## Fase 7 — Verificación en navegador

- [ ] **T7.1** Consola limpia y vista de escritorio
  - **Cubre:** RNF-5, RNF-7, criterio 6
  - **Hecho cuando:** a 1280 px la página carga, no aparece ningún error ni aviso en la consola, y **todos** los textos visibles del mapa están en español: título, nombres de los meses, leyenda, panel de detalle, aviso de descartes e instrucciones del filtro.

- [ ] **T7.2** Vista móvil
  - **Cubre:** RNF-1
  - **Hecho cuando:** a 375 px la rejilla se ve, se desplaza en horizontal, la leyenda y el panel caben y nada queda fuera de la pantalla.

- [ ] **T7.3** Recorrido con teclado
  - **Cubre:** RNF-2b, criterio 9
  - **Hecho cuando:** se recorre toda la rejilla con el teclado sin usar el ratón y cada celda anuncia su fecha y sus minutos.

- [ ] **T7.4** Escenarios de datos
  - **Cubre:** criterio 6
  - **Hecho cuando:** el mapa funciona igual con cero sesiones, con una sola y con muchas, y con el filtro activo mientras se registran datos nuevos.

- [ ] **T7.5** Los datos del usuario siguen intactos
  - **Cubre:** RF-11.1, RF-11.2, RNF-6, criterio 8
  - **Hecho cuando:** una sesión descartada por el mapa sigue apareciendo en la lista de sesiones, se puede corregir desde allí, y al corregirla pasa a verse en el mapa.

- [ ] **T7.6** Movimiento reducido
  - **Cubre:** criterio 10
  - **Hecho cuando:** con la opción de movimiento reducido activada en el sistema, el mapa se usa igual de bien.

---

## Fase 8 — Cierre

- [ ] **T8.1** Actualizar `AGENTS.md`
  - **Cubre:** constitución 6 y 12
  - **Hecho cuando:** la lista de ficheros incluye los tres nuevos, y consta que el código nuevo va en inglés mientras `app.js` sigue en español como deuda que no se toca aquí.

- [ ] **T8.2** Actualizar `MEMORY.md`
  - **Cubre:** criterio 11
  - **Hecho cuando:** refleja la versión nueva, que ahora hay tests, y qué decisiones se tomaron y por qué.

- [ ] **T8.3** Subir la versión en el pie de página
  - **Cubre:** RF-6.1 en cuanto al versionado
  - **Hecho cuando:** el pie de página muestra la versión nueva y coincide con la de `MEMORY.md`.

- [ ] **T8.4** Revisión final contra la spec
  - **Cubre:** todos
  - **Hecho cuando:** las 61 filas de la matriz de cobertura del plan se pueden señalar una por una en el código, y `node --test` sigue en verde.