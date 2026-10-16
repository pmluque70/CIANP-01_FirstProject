# Plan 003 — Lista de sesiones que no se rompe

Spec: `specs/003-resilient-session-list/spec.md`
Constitution: `docs/constitution.md`
Modelo seguido: `specs/001-heat-map/plan.md` y `specs/002-weekly-goal/plan.md`

> **Premisa importante**: la spec 002 ya está aprobada y crea `session-list-logic.js` con la lectura pura `readSessionStore`. Esta spec **añade** `buildSessionRow` a ese mismo fichero, **repara** la lectura heredada y **elimina** el código muerto. No rehace nada de lo que ya existe.

---

## 1. Cómo se respeta la constitución

| Principio | Cómo se cumple en este plan |
|---|---|
| **1. Simplicidad primero** | Sin dependencias, sin build, sin `package.json`. Los scripts se cargan con `<script src>` clásico, sin `type="module"`, para que `file://` siga funcionando. |
| **2. La spec manda** | La matriz de la sección 8 traza cada RF a la parte del plan que lo cubre. |
| **3. Lógica separada de interfaz** | `buildSessionRow` se añade a `session-list-logic.js`, que es pura: recibe la entrada y devuelve el modelo de fila, sin DOM. |
| **4. Tests como puerta** | `session-list.test.js`, que la spec 002 ya crea, se amplía aquí. Ninguna tarea de Fase 4 en adelante empieza con pruebas en rojo. |
| **5. Datos sagrados** | La lectura no escribe. Ninguna entrada se borra ni se modifica sin que la persona lo decida (RF-1.6, RF-2.8). |
| **6. Idioma** | **Pilar.** Todo el código nuevo en inglés, incluidos los tests. Los tres cambios en el fichero heredado van **en español**, dentro de la excepción declarada de la sección 8 de la spec. |
| **7. Compatibilidad** | El mapa de calor solo pierde una línea: su lectura pasa a ser la compartida. No se toca su lógica ni su texto. |

---

## 2. Ficheros

### 2.1 Ficheros que se modifican

| Fichero | Cambio | Motivo | Cubre |
|---|---|---|---|
| `session-list-logic.js` | **Se añade `buildSessionRow`** y el helper `formatDateEs`. El fichero lo crea la spec 002 con `readSessionStore`; aquí se amplía. | RF-2 | La lista se pinta siempre, con textos sustitutos y sin borrar nada. | RF-2.1 a RF-2.9, RF-2.8 |
| `session-list.test.js` | Se añaden los bloques de `buildSessionRow`. Lo crea la spec 002. | RNF-4, RNF-6 | Para que el pintado de la lista sea comprobable sin navegador. | RF-2, RF-4.1 |
| `app.js` | **Tres cambios en español**, dentro de la excepción de la sección 8: (a) la lectura se delega en `readSessionStore`; (b) el pintado de cada fila usa `buildSessionRow`; (c) se borra `calcularMinutosSemana`. | Que un dato guardado corrupto no pueda dejar la página en blanco ni desaparecer de la lista. | RF-1.1 a RF-1.6, RF-2.1 a RF-2.9, RF-5.1 a RF-5.3 |
| `heatmap-ui.js` | **Una línea**: su lectura local se sustituye por la compartida. | RF-1.5: los tres consumidores leen igual. | RF-1.5 |
| `index.html` | **Una línea**: insertar `session-list-logic.js` antes de `heatmap-ui.js`. | El mapa llama a la lectura al cargarse y la función tiene que existir. | RF-1.5 |
| `AGENTS.md` | Estructura de ficheros y regla de idioma. | constitución 6 |  |
| `MEMORY.md` | Estado, decisiones y la excepción declarada. | — |  |

### 2.2 Orden de carga

```
heatmap-logic.js          reglas compartidas: fechas y validez
session-list-logic.js     readSessionStore (spec 002) + buildSessionRow (esta spec)
weekly-goal-logic.js      la semana y el objetivo (spec 002)
heatmap-ui.js             usa readSessionStore al cargar: tiene que ir DESPUÉS
weekly-goal-ui.js
app.js                    avisa a los dos módulos desde renderizar()
```

`heatmap-ui.js` tiene que cargar **después** de `session-list-logic.js`: su `init()` se ejecuta al cargar el script y llama a la lectura compartida. Si se cargara antes, la función no existiría en ese instante, saltaría un `ReferenceError`, `window.heatMap` no se asignaría y la rejilla no se pintaría nunca. La spec 002 ya deja el orden preparado; aquí solo se inserta una línea.

---

## 3. Funciones puras

### 3.1 `session-list-logic.js` — se amplía

| Función | Contrato | Cubre |
|---|---|---|
| `readSessionStore(rawText)` | Ya existe desde la spec 002. **No se toca.** Devuelve `{ status, sessions }` y nunca lanza. | RF-1.1 a RF-1.4, RF-1.6 |
| `buildSessionRow(session, index, todayIso)` | **Nueva.** Devuelve el modelo de fila: qué texto va en fecha, tema y minutos, y si la entrada cuenta. Nunca lanza con ninguna forma de entrada. | RF-2.1 a RF-2.9 |
| `formatDateEs(date)` | **Nuevo helper.** Formatea con las mismas opciones que usa hoy `formatearFecha` en el fichero heredado, para que las filas normales se vean igual. No lee el reloj. | RNF-4 |

```
{
  kind:        "ok" | "no-date" | "not-an-entry",
  dateText:    texto visible del hueco de fecha,
  topicText:   texto visible del hueco de tema,
  minutesText: texto visible del hueco de minutos,
  counts:      booleano,   # true si la entrada cuenta para el objetivo
  index:       entero      # posición en la lista, para editar y borrar
}
```

### 3.2 Funciones del fichero heredado que cambian

| Función | Cambio | Idioma |
|---|---|---|
| `cargarSesiones()` | Su cuerpo pasa a devolver `readSessionStore(localStorage.getItem(STORAGE_KEY)).sessions`. **Mantiene su firma**, así que ningún llamante existente cambia. | español, excepción |
| `leerAlmacenamientoSesiones()` | **Nueva.** Llama a `readSessionStore` y guarda el estado del almacenamiento en una variable del módulo. | español, excepción |
| `cargarSesionesOrdenadas()` | Sigue igual: ahora recibe siempre una lista y ya no puede fallar al ordenar. | — |
| `renderizar()` | El bucle de la lista pasa a pedir `buildSessionRow` a la lógica. | español, excepción |
| `calcularMinutosSemana()` | **Se borra.** No se borra su lectura del reloj ni nada más: se borra la función entera. | — |

---

## 4. Algoritmo en pseudocódigo

### 4.1 `buildSessionRow(session, index, todayIso)`

Vive en `session-list-logic.js` y usa `parseIso`, que viene de `heatmap-logic.js`.

```
funcion buildSessionRow(session, index, todayIso):

    # --- ¿Es una sesión? No se lee ningún campo antes de comprobarlo
    if session es nulo o no es objeto o es una lista:
        devolver {
            kind:        ROW_KIND.NOT_AN_ENTRY,
            dateText:    ROW_TEXT.NOT_AN_ENTRY,
            topicText:   ROW_TEXT.NOT_AN_ENTRY,
            minutesText: ROW_TEXT.NOT_AN_ENTRY,
            counts:      false,
            index:       index
        }

    # --- Fecha
    date := parseIso(session.fecha)          # regla compartida del mapa
    if date es nulo:
        dateText := ROW_TEXT.NO_DATE
    si no:
        dateText := formatDateEs(date)       # helper nuevo

    # --- Minutos: válidos o no
    minutes := session.minutos
    minutosValidos := minutes es número entero
    if minutosValidos:
        minutesText := minutes + " min"
    si no:
        minutesText := ROW_TEXT.NO_MINUTES

    # --- Tema
    topicText := session.tema
    if topicText no es texto o está vacío:
        topicText := ROW_TEXT.NO_TOPIC

    # --- ¿Cuenta? Misma regla de validez que el mapa.
    # Le falta el tema y sigue contando (RF-2.6).
    counts := minutosValidos y date no es nulo

    devolver {
        kind:        si date es nulo: ROW_KIND.NO_DATE; si no: ROW_KIND.OK,
        dateText:    dateText,
        topicText:   topicText,
        minutesText: minutesText,
        counts:      counts,
        index:       index
    }
```

### 4.2 `readSessionStore(rawText)`

**No se reescribe**: la spec 002 ya la define, la prueba y la deja funcionando. Aquí solo se **consume** desde los tres sitios. Si algún día cambiara su contrato, cambiarían los tres a la vez, que es justo lo que RF-1.5 quiere.

---

## 5. Cómo se pinta la lista

`app.js` deja de leer campos a ciegas. El bucle pasa a ser:

1. Pedir `buildSessionRow(session, indice, hoyIso)` a la lógica.
2. Crear el `<li>` y rellenarlo con `dateText`, `topicText` y `minutesText`.
3. Poner los botones de editar y borrar con el mismo `indice` de siempre, para que borrar y editar no cambien de comportamiento.

Los estilos **no cambian**: los textos sustituto ocupan los huecos que ya existen. Solo hace falta que el texto sustituto se distinga visualmente de un dato real sin depender del color (RNF-2), con el mismo tono apagado que ya usa la etiqueta de fecha.

El aviso de registros ignorados **no se pinta aquí**: es el del mapa de calor, sin cambios (RF-3.1).

---

## 6. Decisiones técnicas

### D1. Añadir al fichero de la spec 002, no crear otro

**Elegido**: `buildSessionRow` y `formatDateEs` se añaden a `session-list-logic.js`.

**Descartado**: un tercer fichero de lógica pura para la lista. Partiría la lectura y el modelo de fila en dos sitios que siempre van juntos, y la lectura es justo lo que debe estar en un único sitio.

### D2. El modelo de fila devuelve el texto ya escrito

**Elegido**: la lógica devuelve "Registro ilegible", "Registro sin fecha", "Sin tema" y "Sin minutos" como literales, en un bloque de constantes `ROW_TEXT`.

**Descartado**: devolver un código y que `app.js` elija el texto. Sería lógica escondida en la interfaz, y el criterio 8 exigiría comprobar cuatro cadenas sin que ninguna prueba las fijara. Con los literales en la lógica, un test los comprueba contra la tabla de RF-4.1.

**Descartado**: devolver la fecha como texto ISO y que `app.js` la formatee. Mezclaría el formato de fecha del legado con el modelo, y obligaría a duplicar el formateo en dos sitios.

### D3. Una lectura para tres consumidores

**Elegido**: los tres leen con `readSessionStore`, que ya existe y ya está probada desde la spec 002.

**Descartado**: arreglar solo la lectura del fichero heredado y dejar las otras dos como estaban. RF-1.5 exige una lectura, y dos criterios distintos acabarían divergiendo sin que nada lo detecte.

### D4. Entrada sin tema: se muestra y cuenta

**Elegido**: `counts` solo depende de la fecha y de los minutos (RF-2.6).

**Descartado**: tratar toda entrada incompleta como malformada y excluirla. El tema es una etiqueta descriptiva, no el dato que sostiene las estadísticas: excluirla perdería minutos que sí están registrados, que es justo lo que la constitución 5 prohíbe.

### D5. Orden de carga con `heatmap-ui.js` detrás

**Elegido**: `heatmap-ui.js` carga después de los ficheros de lógica, como ya dejó la spec 002.

**Descartado**: cargar la interfaz antes y que la lectura se resuelva en el primer `render()`. Exigiría retrasar el arranque del mapa y cambiaría el código entregado que hoy funciona.

### D6. El código muerto se borra, no se traduce

**Elegido**: `calcularMinutosSemana` desaparece (RF-5).

**Descartado**: reutilizarla para el objetivo. La spec 002 calcula los minutos con una función pura propia que recibe "hoy" como parámetro, y reutilizar una función que lee el reloj iría contra la constitución 3.

**Descartado**: traducirla al inglés antes de borrarla. Sería trabajo sin destino.

### D7. Los tres cambios del fichero heredado, en español

**Elegido**: se escriben en español, dentro de la excepción declarada.

**Descartado**: escribirlos en inglés. Haría que el fichero contenga los dos idiomas sin que la excepción lo anuncie, que es exactamente lo que el principio 7 quiere evitar.

---

## 7. Estrategia de tests

### 7.1 Mecánica

- `session-list.test.js`, que la spec 002 ya crea con los bloques de `readSessionStore`. Aquí se **añaden** los de `buildSessionRow`.
- `node --test`, sin instalar nada. Sin `package.json`.
- Todas las pruebas pasan `todayIso` explícitamente.

### 7.2 Bloques que se añaden

| Bloque | Qué verifica | RF |
|---|---|---|
| `buildSessionRow` no es una sesión | `null`, número, texto y lista devuelven los tres huecos con "Registro ilegible" y `counts` a falso | RF-2.1, RF-2.2 |
| `buildSessionRow` sin fecha | Fecha ilegible: "Registro sin fecha", el resto intacto | RF-2.3 |
| `buildSessionRow` sin tema | Tema ausente o vacío: "Sin tema", y `counts` sigue siendo verdadero si fecha y minutos son válidos | RF-2.4, RF-2.6 |
| `buildSessionRow` sin minutos válidos | Cero, negativos, decimales, texto y por encima de 1440: "Sin minutos" y `counts` a falso | RF-2.5 |
| `buildSessionRow` con todo válido | Se pinta normal y `counts` a verdadero | RF-2.6 |
| `buildSessionRow` no muta | La entrada recibida es idéntica antes y después | RF-2.8 |
| **`Los cuatro literales`** | Un test compara las cadenas devueltas con las de la tabla de RF-4.1 | RF-4.1, criterio 8 |
| `formatDateEs` | Produce "2 oct 2026" para `2026-10-02` | RNF-4 |
| `buildSessionRow` con `todayIso` futuro | Una entrada con fecha futura muestra sus minutos pero `counts` a falso, con la misma regla de validez que el mapa | RF-2.5 |
| **Determinismo** | Dos llamadas con la misma fecha dan el mismo resultado | RNF-5 |

### 7.3 Verificación en navegador

Los tests cubren la lógica, no el DOM. Con el MCP de Chrome DevTools, y **en los tres estados del almacenamiento** (legible, lista con malformados e ilegible), a 1280 px y a 375 px: consola limpia, lista pintada entera, textos sustitutos correctos, borrado de una entrada malformada sin tocar las demás, y medición con 2000 sesiones frente a la referencia previa.

---

## 8. Matriz de cobertura

| RF | Dónde se resuelve |
|---|---|
| RF-1.1 | `readSessionStore`, ya probada desde la spec 002 |
| RF-1.2 | `readSessionStore` devuelve estado vacío |
| RF-1.3 | `readSessionStore` devuelve estado ilegible |
| RF-1.4 | `readSessionStore` devuelve la lista sin filtrar |
| RF-1.5 | `app.js`, `heatmap-ui.js` e `index.html`: los tres leen con la misma función |
| RF-1.6 | `readSessionStore` es pura y no escribe |
| RF-2.1 | `buildSessionRow` con cualquier forma de entrada, sin lanzar |
| RF-2.2 | `buildSessionRow` devuelve los tres huecos con "Registro ilegible" |
| RF-2.3 | `buildSessionRow` sin fecha legible |
| RF-2.4 | `buildSessionRow` sin tema |
| RF-2.5 | `buildSessionRow` con minutos no válidos |
| RF-2.6 | `buildSessionRow` con fecha y minutos válidos y sin tema: `counts` a verdadero |
| RF-2.7 | El botón de borrar usa el `index` del modelo, como antes |
| RF-2.8 | `buildSessionRow` no muta la entrada |
| RF-2.9 | `iniciarEdicion` con la entrada malformada y guardado posterior |
| RF-3.1 | El aviso lo sigue pintando solo el mapa de calor |
| RF-3.2 | Texto del mapa, sin cambios |
| RF-4.1 | Constantes `ROW_TEXT` con los cuatro literales, fijados por un test |
| RF-4.2 | Los cuatro literales no llevan cifras |
| RF-4.3 | El aviso es el del mapa, sin variantes |
| RF-5.1 | `calcularMinutosSemana` desaparece del fichero heredado |
| RF-5.2 | La página se comporta igual antes y después de borrarla |
| RF-5.3 | No se traduce nada más |
| RNF-1 | Estilos existentes, comprobados a 375 y 1280 |
| RNF-2 | Tono apagado para los textos sustituto, sin depender del color |
| RNF-3 | Los botones no cambian: siguen siendo los mismos |
| RNF-4 | `buildSessionRow` es pura y tiene pruebas |
| RNF-5 | Todas reciben `todayIso`; bloque de determinismo |
| RNF-6 | Bloques añadidos a `session-list.test.js` |
| RNF-7 | Comparación del pintado con 2000 sesiones |
| RNF-8 | Ninguna escritura sobre el almacenamiento |
| RNF-9 | Los cuatro literales en español |
| RNF-10 | Sin movimiento nuevo: los estilos no cambian |
| RNF-11 | Código nuevo en inglés; cambios del legado en español, declarados |
| RNF-12 | No se traduce el fichero heredado |

---

## 9. Orden de ejecución

1. `buildSessionRow` y `formatDateEs` en `session-list-logic.js`, **antes de tocar nada más**.
2. Los bloques de prueba correspondientes, hasta que estén en verde junto con los que ya trae la spec 002 (constitución 4).
3. `heatmap-ui.js`: una línea, e `index.html`: una línea. Con el mapa **intacto**.
4. `app.js`: lectura delegada, con la firma de `cargarSesiones` intacta.
5. `app.js`: pintado de la lista con el modelo de fila.
6. `app.js`: borrar `calcularMinutosSemana`.
7. Verificación en navegador según 7.3.
8. `AGENTS.md` y `MEMORY.md`.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| El orden de carga rompe el mapa, que está en producción | 2.2 lo deja explícito y T3 lo comprueba en la misma tarea, con la rejilla y el aviso como prueba |
| Ocultar datos detrás de un texto sustituto | D2: los literales se prueban contra la tabla y la entrada sigue siendo borrable |
| Excluir del cálculo una entrada que solo carece de tema | D4: `counts` depende de fecha y minutos, y hay test |
| Que la lista se pinte y la escritura de una sesión siga rota | La escritura va por `guardarSesiones`, que no cambia: el orden de edición se respeta sobre la lista ordenada |
| Que borrar una malformada borre otra | El borrado sigue por índice de la lista ordenada, y el modelo devuelve el mismo índice |

---

## 11. Fuera de este plan

No se implementa nada de la sección 8 de la spec (fuera de alcance). No se corrige el texto del mapa de calor sobre días sin registro: es una spec de cambio aparte. No se traduce el fichero heredado: queda como tarea propia (RNF-12).