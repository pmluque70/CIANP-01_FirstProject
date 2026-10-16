# Plan 002 — Objetivo semanal de estudio

Spec: `specs/002-weekly-goal/spec.md`
Constitution: `docs/constitution.md`
Modelo seguido: `specs/001-heat-map/plan.md`

---

## 1. Cómo se respeta la constitución

| Principio | Cómo se cumple en este plan |
|---|---|
| **1. Simplicidad primero** | Sin dependencias, sin build, sin `package.json`. Los ficheros nuevos se cargan con `<script src>` clásico, sin `type="module"`, para que `file://` siga funcionando con doble clic. |
| **2. La spec manda** | La matriz de la sección 8 traza cada RF a la parte del plan que lo cubre. No se añade comportamiento que no esté en la spec. |
| **3. Lógica separada de interfaz** | `weekly-goal-logic.js` no toca el DOM ni el almacenamiento: recibe el texto guardado y devuelve datos. Toda función de cálculo recibe `todayIso` como parámetro y ninguna lee el reloj. |
| **4. Tests como puerta** | `weekly-goal.test.js` con `node --test`, sin instalar nada. La lógica se prueba antes de tocar la interfaz, y no se avanza con pruebas en rojo. |
| **5. Datos sagrados** | El objetivo se guarda en una clave nueva. Las sesiones no se borran, no se migran y no se reescriben, ni siquiera cuando están corruptas (RF-7.2, RF-10.6). |
| **6. Idioma** | **Pilar, no decisión.** Todo el código nuevo va en inglés, incluidos los tests. Los literales de pantalla van en español, tomados literalmente de RF-9.1. En `app.js` solo se quita una línea y se añade otra, en español, y es consecuencia directa de RF-8.2, no una traducción (D4). |
| **7. Compatibilidad** | El mapa de calor **no se toca**: ni su lógica, ni sus textos, ni su lectura del almacén, que es de la spec 003. El texto del mapa sobre días sin registro tampoco se cambia (RF-6.8). |

---

## 2. Ficheros

### 2.1 Ficheros nuevos

| Fichero | Responsabilidad | Cubre |
|---|---|---|
| `weekly-goal-logic.js` | **Solo lógica pura.** Inicio de la semana, minutos registrados de la semana, validación y normalización del objetivo, progreso y modelo de vista que se pinta. Sin DOM, sin `localStorage`, sin `new Date()` sin argumentos. La lectura del almacén **no** vive aquí: está en `session-list-logic.js`. | RF-1.1 a RF-1.7, RF-2.3 a RF-2.6, RF-3.1 a RF-3.8, RF-4.1 a RF-4.4, RF-5.1, RF-5.5, RF-6.1, RF-6.2, RF-7.3, RF-7.7, RF-7.8, RF-10.1 a RF-10.4, RNF-4, RNF-5 |
| `session-list-logic.js` | **Solo lógica pura.** Lectura defensiva del almacén de sesiones: distingue vacío de ilegible y nunca lanza. La usan el objetivo y, desde la spec 003, el mapa y la lista. | RF-10.1 a RF-10.4, RNF-4, RNF-6 |
| `weekly-goal-ui.js` | **Solo interfaz.** Lleva su **arranque propio** (D12): al cargarse lee el almacenamiento con la lectura pura y pinta el bloque sin esperar a nadie. Después pinta etiqueta, línea de minutos, barra, avisos y mensajes, gestiona el flujo de edición y detecta el cambio de semana al recuperar el foco. Expone `window.weeklyGoal.render()`. | RF-2.1, RF-2.7 a RF-2.11, RF-3.1, RF-3.9 a RF-3.11, RF-4.5 a RF-4.9, RF-5.2, RF-7.1, RF-7.4, RF-7.5, RF-8.1 a RF-8.7, RF-9.1 a RF-9.7, RF-10.3, RF-10.5, RF-10.7 a RF-10.9, RNF-1, RNF-2, RNF-3, RNF-10 |
| `weekly-goal.test.js` | Pruebas de la lógica del objetivo con `node --test`. En inglés. | RNF-6, y los RF de cálculo de la sección 7 |

### 2.2 Ficheros modificados

| Fichero | Cambio | Motivo | Cubre |
|---|---|---|---|
| `app.js` | **Dos cambios mínimos, en español**: (a) `renderizar()` deja de pintar la estadística "Esta semana", porque su nodo desaparece con RF-8.2, y (b) una llamada de aviso al objetivo al final de `renderizar()`. Nada más: ni la lectura, ni la lista. | Si la llamada se quedara, la aplicación intentaría pintar un elemento que ya no existe. | RF-8.2, RF-3.9 |
| `index.html` | Dentro de la tarjeta de racha, la estadística "Esta semana" se sustituye por el bloque del objetivo. Se cargan los dos scripts nuevos **antes** de `app.js`. | RF-8.1, RF-8.2, RF-8.7 | RF-8.1, RF-8.2, RF-8.7 |
| `styles.css` | Estilos del bloque del objetivo: cabecera, etiqueta, línea de minutos, barra, formulario de edición, mensajes y el estado cumplido. | RNF-1, RNF-2, RNF-10 | RNF-1, RNF-2, RNF-10 |
| `AGENTS.md` | Estructura de ficheros y regla de idioma para el código nuevo. | constitución 6 | — |
| `MEMORY.md` | Estado, decisiones y errores a evitar. | criterio 21 | — |

> `app.js` **no se reescribe ni se traduce**. Se toca en **dos líneas** (sección 8 de la spec): se quita la llamada a la estadística que desaparece y se añade el aviso al objetivo. No hay ninguna excepción a la constitución 7 en esta spec: esa excepción se trasladó íntegra a la 003.

### 2.3 Orden de carga en `index.html`

Este bloque es la **lista autoritativa** de los scripts de la página. `heatmap-ui.js` está en producción y **no sale de aquí**: quitarlo de la lista dejaría la página sin mapa de calor.

```html
<script src="heatmap-logic.js"></script>
<script src="session-list-logic.js"></script>   <!-- reglas compartidas: fechas y validez -->
<script src="weekly-goal-logic.js"></script>  <!-- depende de las reglas compartidas -->
<script src="heatmap-ui.js"></script>          <!-- el mapa, en su posición de hoy -->
<script src="weekly-goal-ui.js"></script>      <!-- el objetivo, con arranque propio -->
<script src="app.js"></script>                <!-- avisa al objetivo desde renderizar() -->
```

**Por qué en este orden.**

1. `heatmap-logic.js` va primero porque `session-list-logic.js` y `weekly-goal-logic.js` **leen de él** al cargarse (D2), con la misma guarda que decide entre el navegador y Node.
2. Los dos ficheros de lógica pura van antes de las interfaces porque al cargarse solo definen funciones.
3. `heatmap-ui.js` se queda **donde está hoy**, entre la lógica y `app.js`. Esta spec no lo toca, pero deja su posición lista para que la spec 003 inserte ahí la lectura compartida, que se ejecuta al cargar ese script.
4. `weekly-goal-ui.js` va después de su lógica y **antes** de `app.js`. Su arranque propio no depende de nada más, así que en cuanto se carga, el bloque del objetivo ya está en pantalla.
5. `app.js` va el último porque su `renderizar()` notifica al objetivo.
---

## 3. Funciones puras de lógica

Hay **dos** ficheros de lógica pura, y la separación es por consumidor, no por comodidad: `heatmap-logic.js` y `session-list-logic.js` atienden a lo que ya está en producción (el mapa y la lista), y `weekly-goal-logic.js` atiende solo a lo nuevo. Todos son puros: mismos datos y misma `todayIso` producen el mismo resultado, sin importar cuándo se ejecuten (RF-1.3, RNF-5).

### 3.1 `session-list-logic.js` — datos que ya estaban

| Función | Contrato | Cubre |
|---|---|---|
| `readSessionStore(rawText)` | Recibe el **texto bruto** del almacenamiento (o `null`) y devuelve `{ status, sessions }` con `status` en `empty`, `unreadable` u `ok`. Nunca lanza errores. No lee `localStorage`: eso lo hace quien la llama. | RF-10.1, RF-10.2, RF-10.3, RF-10.4 |

### 3.2 `weekly-goal-logic.js` — la semana y el objetivo

| Función | Contrato | Cubre |
|---|---|---|
| `weekStartIso(todayIso)` | Devuelve el lunes de la semana que contiene `todayIso`, en hora local. | RF-1.2, RF-4.1 |
| `sumWeekMinutes(sessions, todayIso)` | Suma los minutos de las sesiones **válidas** desde el lunes hasta hoy, ambos incluidos. | RF-1.1, RF-1.3, RF-1.4, RF-1.5, RF-1.6, RF-1.7, RF-5.5 |
| `parseGoalInput(rawValue)` | Recibe el texto del campo y devuelve `{ ok: true, minutes }` o `{ ok: false }`. Acepta solo enteros escritos en cifras dentro de 1 a 10080. | RF-2.4, RF-2.5, RF-2.6 |
| `resolveGoal(storedValue)` | Recibe el texto guardado del objetivo (o `null`) y devuelve `{ minutes, isDefault, unreadable }`. Nunca escribe. | RF-2.3, RF-7.3, RF-7.7, RF-7.8 |
| `computeGoalProgress(loggedMinutes, goalMinutes)` | Devuelve `{ state, remainingMinutes, ratio }`. `state` es `in-progress` o `met`; `ratio` va de 0 a 1 y nunca pasa de 1. | RF-3.2, RF-3.3, RF-3.5, RF-3.8 |
| `buildWeeklyGoalView(sessions, storeStatus, storedGoal, todayIso)` | **Función principal.** Devuelve todo lo que la interfaz necesita para pintar, ya resuelto. | RF-2.3, RF-3.1, RF-3.6, RF-3.7, RF-4.2, RF-4.3, RF-5.1, RF-10.3, RF-10.5 |

### 3.3 Constantes

| Constante | Valor | Por qué |
|---|---|---|
| `DEFAULT_GOAL_MINUTES` | `30` | Valor por defecto decidido (RF-2.3). |
| `MIN_GOAL_MINUTES` | `1` | RF-2.5. |
| `MAX_GOAL_MINUTES` | `10080` | Tope de seguridad (RF-2.5), no imposibilidad. |
| `GOAL_STORAGE_KEY` | `'diarioEstudio_objetivo_semanal'` | Clave nueva e independiente de las sesiones (RF-7.1). Vive en la lógica pura **a propósito**, para que exista **una sola copia** de ese texto: la interfaz la usa desde aquí en lugar de repetirla, y un error de tecleo en una de dos copias guardaría el objetivo en una clave que la app ya no lee. |
| `GOAL_STATE` | `{ IN_PROGRESS: 'in-progress', MET: 'met' }` | Los estados los decide la lógica; la interfaz solo traduce el estado (mismo patrón que el mapa). |
| `STORE_STATUS` | `{ EMPTY: 'empty', UNREADABLE: 'unreadable', OK: 'ok' }` | Distingue vacío de ilegible (RF-10.2, RF-10.3). Es la **única** constante de forma que necesita esta spec: `ROW_KIND` y `ROW_FIELD` pertenecen al modelo de fila de la lista, que es de la spec 003. |

### 3.4 Forma del modelo de vista del objetivo

Contrato conceptual, no código:

```
{
  todayIso:        "AAAA-MM-DD",
  weekStartIso:    "AAAA-MM-DD",   // lunes de la semana en curso
  goalMinutes:     entero >= 1,    // el vigente, por defecto 30
  isDefaultGoal:   booleano,       // true si nadie lo ha elegido
  goalUnreadable:  booleano,       // el guardado existe pero no se pudo leer
  loggedMinutes:   entero >= 0,    // minutos registrados de la semana
  remainingMinutes: entero >= 0,   // 0 si la meta está cumplida
  ratio:           numero en [0, 1],
  state:           "in-progress" | "met",
  storeStatus:     "empty" | "unreadable" | "ok",
  showSessionsNotice: booleano     // true solo si storeStatus === "unreadable"
}
```


---

## 4. Algoritmo en pseudocódigo

> **Dónde vive cada uno**: 4.1 en `session-list-logic.js`; de 4.2 a 4.7 en `weekly-goal-logic.js`. Los dos usan las reglas compartidas de `heatmap-logic.js`.

### 4.1 `readSessionStore(rawText)` — en `session-list-logic.js`

```
funcion readSessionStore(rawText):

    # --- Vacío: no hay nada guardado ---------------------------
    if rawText es nulo:                   # lo que devuelve localStorage sin clave
        devolver { status: STORE_STATUS.EMPTY, sessions: [] }
    if rawText sin espacios está vacío:
        devolver { status: STORE_STATUS.EMPTY, sessions: [] }

    # --- Ilegible: hay algo guardado y no se puede leer --------
    # La comprobación va ANTES de recortar, porque un valor que no es
    # texto no admite trim. Y no se informa como vacío: hay algo
    # guardado ahí, y decir que no hay sesiones sería afirmar algo
    # que el dato no demuestra (MEMORY.md).
    if rawText no es texto:
        devolver { status: STORE_STATUS.UNREADABLE, sessions: [] }

    # --- Interpretable -------------------------------------------
    # JSON.parse puede lanzar: se captura y no se propaga (RF-10.1)
    parsed := JSON.parse(rawText)
    if la interpretación falló:
        devolver { status: STORE_STATUS.UNREADABLE, sessions: [] }
    if parsed no es una lista:
        devolver { status: STORE_STATUS.UNREADABLE, sessions: [] }
    if parsed no tiene elementos:
        devolver { status: STORE_STATUS.EMPTY, sessions: [] }

    # --- Lista legible --------------------------------------------
    # Los elementos malformados SE CONSERVAN: no se borran ni se reparan.
    # Quien calcula ya los descarta con la regla de validez común.
    devolver { status: STORE_STATUS.OK, sessions: parsed }
```

> Clave del criterio: **vacío no es ilegible**. Con la lista vacía, el texto en blanco o `null` no hay aviso; con un valor que no es texto, con un texto que no se puede interpretar o con un texto que se interpreta en otra cosa que no sea una lista, sí (RF-10.2 y RF-10.3, que antes se contradecían).

### 4.2 `weekStartIso(todayIso)`

```
funcion weekStartIso(todayIso):
    date   := parseIso(todayIso)               # NUNCA new Date("AAAA-MM-DD")
    monday := mondayOf(date)                   # del mapa de calor
    devolver formatIso(monday)
```

> Se reutilizan las utilidades ya probadas del mapa de calor (D2). Todo el cálculo de días usa **suma y resta de días en hora local**, nunca milisegundos ni `toISOString()`.

### 4.3 `sumWeekMinutes(sessions, todayIso)`

```
funcion sumWeekMinutes(sessions, todayIso):

    weekStart := weekStartIso(todayIso)
    total     := 0

    para cada session en sessions:
        # Regla de validez ÚNICA y compartida con el mapa de calor
        if no es session válida para todayIso:
            continuar
        if session.fecha < weekStart:      continuar   # semana anterior
        if session.fecha > todayIso:       continuar   # futuro: nunca suma
        total := total + session.minutos

    devolver total
```

Las fechas se comparan como texto `"AAAA-MM-DD"`: con el cero a la izquierda, ese orden coincide con el cronológico, y es el patrón que ya usa el mapa de calor.

> `session.fecha` y `session.minutos` son los **nombres de los campos guardados**, que están en español porque ese es el formato que ya tiene el usuario. El código que los maneja va en inglés; los datos no se renombran (RF-7.2, RNF-8).

### 4.4 `parseGoalInput(rawValue)`

```
funcion parseGoalInput(rawValue):

    if rawValue no es texto:        devolver { ok: false }    # defensivo
    text := rawValue sin espacios

    # Solo dígitos: rechaza "1e3", "+30", "30.0", "30,5", "30 min" y vacío
    if text no contiene solo dígitos:   devolver { ok: false }
    minutes := Number(text)             # "030" → 30

    if minutes < MIN_GOAL_MINUTES:      devolver { ok: false }   # cubre "0"
    if minutes > MAX_GOAL_MINUTES:      devolver { ok: false }

    devolver { ok: true, minutes }
```

> No se usa `parseInt`: `parseInt("1e3")` daría 1 mientras el navegador puede leer la misma cadena como 1000, y la pantalla no puede afirmar cuál de las dos cosas quería la persona (RF-2.4).

### 4.5 `resolveGoal(storedValue)`

```
funcion resolveGoal(storedValue):

    # --- No hay objetivo guardado: valor por defecto, sin aviso ----
    # Solo nulo significa "nada guardado": es lo que devuelve
    # localStorage cuando la clave no existe.
    if storedValue es nulo:
        devolver { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: false }
    if storedValue sin espacios está vacío:
        devolver { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: false }

    # --- Ilegible: hay algo guardado y no se puede leer ----------
    # Mismo criterio que la lectura del almacén en 4.1: un valor que
    # no es texto no se informa como vacío, porque hay algo guardado
    # ahí y callar ocultaría que el objetivo se perdió (MEMORY.md).
    if storedValue no es texto:
        devolver { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: true }

    # --- Hay algo guardado: se interpreta con el MISMO criterio ---
    parsed := parseGoalInput(storedValue)

    if not parsed.ok:
        # Texto, decimales o fuera de rango: aviso, nunca silencio
        devolver { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: true }

    devolver { minutes: parsed.minutes, isDefault: false, unreadable: false }
```

> Consultar **nunca escribe**: `resolveGoal` es pura y su llamante no escribe nada al leer (RF-7.6, RF-7.8). Por eso los 30 minutos nunca quedan guardados mientras nadie confirme un valor.

### 4.6 `computeGoalProgress(loggedMinutes, goalMinutes)`

```
funcion computeGoalProgress(loggedMinutes, goalMinutes):

    goal := max(MIN_GOAL_MINUTES, goalMinutes)   # goalMinutes siempre >= 1

    if loggedMinutes < goal:
        devolver {
            state:           GOAL_STATE.IN_PROGRESS,
            remainingMinutes: goal - loggedMinutes,
            ratio:           Math.max(0, Math.min(1, loggedMinutes / goal))
        }

    # Cumplida: sin minutos restantes, sin exceso y sin pasar de 1
    devolver { state: GOAL_STATE.MET, remainingMinutes: 0, ratio: 1 }
```

### 4.7 `buildWeeklyGoalView(sessions, storeStatus, storedGoal, todayIso)`

```
funcion buildWeeklyGoalView(sessions, storeStatus, storedGoal, todayIso):

    weekStart := weekStartIso(todayIso)
    logged    := sumWeekMinutes(sessions, todayIso)
    goal      := resolveGoal(storedGoal)
    progress  := computeGoalProgress(logged, goal.minutes)

    devolver {
        todayIso:           todayIso,
        weekStartIso:       weekStart,
        goalMinutes:        goal.minutes,
        isDefaultGoal:      goal.isDefault,
        goalUnreadable:     goal.unreadable,
        loggedMinutes:      logged,
        remainingMinutes:   progress.remainingMinutes,
        ratio:              progress.ratio,
        state:              progress.state,
        storeStatus:        storeStatus,
        # El aviso de sesiones ilegibles solo aparece si el almacén es ilegible:
        # con la lista vacía no se avisa de nada (RF-10.2, RF-10.3, RF-10.5)
        showSessionsNotice: storeStatus es STORE_STATUS.UNREADABLE
    }
```

---

## 5. Cómo se pinta en la interfaz

### 5.1 Dónde va

Dentro de la **tarjeta de racha**, en `.racha-stats`, sustituyendo el `<div class="stat">` de "Esta semana" (RF-8.1, RF-8.2). No se añade ninguna sección nueva ni se altera el orden de las pantallas (RF-8.7).

El bloque ocupa **una fila propia a todo el ancho** debajo de las dos estadísticas que quedan ("Mejor racha" y "Este mes"), porque necesita la barra y dos líneas de texto, y porque la rejilla de tres columnas no da sitio (D7).

### 5.2 Estructura del HTML

```
<div class="objetivo" id="objetivoSemanal">
    <div class="objetivo-cabecera">
        <span class="objetivo-etiqueta" id="objetivoEtiqueta">Objetivo semanal</span>
        <button type="button" class="objetivo-editar" id="objetivoEditar">Cambiar objetivo</button>
    </div>

    <p class="objetivo-linea" id="objetivoLinea"></p>

    <div class="objetivo-barra" id="objetivoBarra"
         role="progressbar" aria-valuemin="0" aria-valuemax="100"
         aria-valuenow="0">
        <span class="objetivo-barra-valor" id="objetivoBarraValor"></span>
    </div>

    <form class="objetivo-form" id="objetivoForm" hidden>
        <label for="objetivoCampo">Objetivo en minutos</label>
        <input id="objetivoCampo" name="objetivo" type="text" inputmode="numeric"
               autocomplete="off" spellcheck="false">
        <div class="objetivo-acciones">
            <button type="submit" class="objetivo-guardar">Guardar</button>
            <button type="button" class="objetivo-cancelar" id="objetivoCancelar">Cancelar</button>
        </div>
    </form>

    <p class="objetivo-mensaje" id="objetivoMensaje" hidden></p>
    <p class="objetivo-aviso" id="objetivoAviso" hidden></p>
</div>
```

- El campo es de **texto con `inputmode="numeric"`**, no de tipo número (D6).
- El `hidden` del formulario y de los dos párrafos es lo que implementa RF-8.3: fuera de la edición no se ve ningún campo ni botón de guardar o cancelar.
- El `id="minutosSemana"` desaparece del HTML, porque esa estadística deja de existir (RF-8.2).
- Los scripts se cargan en el orden de 2.3. Esta spec **no toca** `heatmap-ui.js`.

### 5.3 Qué se pinta en cada estado

| Situación | Etiqueta | Línea | Barra | Mensaje o aviso |
|---|---|---|---|---|
| Objetivo por defecto | "Objetivo semanal (30 min por defecto)" | "Llevas 45 min registrados de 300 min" | Fracción de 45 sobre 300 | Ninguno |
| Objetivo confirmado, meta en curso | "Objetivo semanal" | "Llevas 45 min registrados de 300 min" y "Te faltan 255 min por registrar" | Fracción de 45 sobre 300 | Ninguno |
| Meta cumplida | "Objetivo semanal" | "Llevas 12000 min registrados" | Al 100 % | Ninguno |
| Objetivo guardado ilegible | "Objetivo semanal (30 min por defecto)" | La del valor por defecto | La del valor por defecto | Aviso de objetivo ilegible |
| Lectura ilegible | Como corresponda al objetivo | "Llevas 0 min registrados de 300 min" | Vacía | Aviso de sesiones ilegibles |
| Valor no válido escrito | No cambia | No cambia | No cambia | Mensaje de objetivo no válido |
| No se puede guardar | No cambia | No cambia | No cambia | Mensaje de error de guardado |
| Sin objetivo guardado | "Objetivo semanal (30 min por defecto)" | La del valor por defecto | La del valor por defecto | **Ninguno**: el almacenamiento del objetivo no se escribe |

Todos esos textos son **exactamente** los de RF-9.1, con las cifras sustituidas. No hay ningún otro texto visible (RF-9.1). Al cumplirse la meta **desaparecen** la comparación con el objetivo y la línea de minutos que faltan, y el valor del objetivo deja de aparecer como cifra (RF-3.3, RF-9.4).

La barra es `role="progressbar"` con `aria-valuenow` en porcentaje entero. **El nombre accesible se escribe al pintar**, nunca como `aria-label` vacío en el HTML estático: se sigue el patrón que ya usa el mapa con su función `ariaFor()` (`heatmap-ui.js:96`), que compone el texto accesible a partir del modelo. Así el lector de pantalla recibe un literal de RF-9.1 y no una cadena inventada en el marcado.

### 5.4 Flujo de edición

1. Pulsar "Cambiar objetivo" muestra el formulario con el **valor vigente** en el campo y lleva el foco al campo (RF-8.4).
2. **Guardar** o Intro: se llama a `parseGoalInput` con el texto del campo.
   - Si no es válido: se muestra el mensaje de objetivo no válido, **no se guarda nada** y el objetivo vigente no cambia (RF-2.4, RF-2.5, RF-2.6).
   - Si es válido: se escribe el valor en la clave del objetivo, se sale de la edición y se vuelve a pintar (RF-2.7). Si la escritura lanza error, se muestra el mensaje de error de guardado y el objetivo vigente no cambia (RF-7.5).
3. **Cancelar**: se sale de la edición, no se guarda nada y no queda ningún mensaje (RF-9.6).

Ningún otro atajo guarda el objetivo (RF-8.6). Si el objetivo indicado es menor que los minutos ya registrados, se acepta en el mismo gesto, sin diálogo (RF-2.9).

### 5.5 Cambio de semana con la aplicación abierta

- Al iniciar y en cada `render()`, la interfaz lee el reloj **una sola vez** por su propio punto de lectura y guarda la semana en uso.
- Se vuelve a leer el reloj **al recuperar el foco de la pestaña** y en cada `render()` que provoque añadir, editar o borrar una sesión (RF-4.6).
- Si la semana leída es distinta de la que había, se vuelve a pintar el objetivo y el progreso con la fecha nueva (RF-4.7).
- **No hay temporizador**: sin que se dé ninguno de esos dos momentos, la vista sigue mostrando la semana anterior hasta la siguiente lectura (RF-4.8).

> **`readTodayIso()` es un helper NUEVO** de `weekly-goal-ui.js`, y es la única lectura de reloj que pertenece a esta funcionalidad (RF-4.5). Construye el texto con `getFullYear()`, `getMonth() + 1` y `getDate()`, rellenando con ceros, igual que hace hoy `hoyComoString()` en `app.js`, y no usa `toISOString()`. Las demás lecturas de reloj del proyecto se quedan donde están: esta spec **no las unifica** (RNF-5).

### 5.6 Accesibilidad y movimiento

- El botón "Cambiar objetivo", el campo y los dos botones son alcanzables con `Tab` y con foco visible (RNF-3).
- El estado cumplido **no** se distingue solo por color: además del texto "Meta cumplida", la barra pasa a relleno sólido y la etiqueta del bloque cambia de aspecto (RNF-2).
- Cualquier transición de la barra se declara en CSS dentro de `prefers-reduced-motion`, siguiendo lo que ya hace el proyecto (RNF-10).
- Los botones tienen `:active`, y su `hover` va dentro de `@media (hover: hover)`, como ya hace `styles.css`.

### 5.7 Reacción a los cambios de datos

`renderizar()` en `app.js` ya se invoca al añadir, editar y borrar. Esta spec le quita **una línea** y le añade **una**:

```
    // La estadística "Esta semana" ya no existe: su nodo desapareció (RF-8.2).
    // Avisar a la funcionalidad que tiene su propia vista
    if (window.weeklyGoal) window.weeklyGoal.render();
```

Si la llamada a `mostrarValor(minutosSemana, ...)` se quedara, la aplicación intentaría pintar un elemento que ya no está en el HTML. La función `calcularMinutosSemana` **no se borra aquí**: queda sin uso y su eliminación es de la spec 003.

Esa llamada es el **refresco** de la tabla de D10: repinta el bloque entero por encima de lo que ya pintó el arranque propio. Si `renderizar()` se detiene antes de llegar —que es lo que pasa con un almacenamiento ilegible—, el bloque conserva lo que pintó el arranque (RF-10.8).

El arranque propio (D10) **no necesita ninguna línea en `app.js`**: se ejecuta al cargarse `weekly-goal-ui.js`, que va antes que `app.js` en el orden de 2.3. Por eso el bloque del objetivo ya está en pantalla aunque `app.js` no llegue a pintar nada.

El arranque cumple además RF-4.6 en su segundo punto: cada cambio de sesión vuelve a leer el reloj, porque el refresco pasa por .

---

## 6. Decisiones técnicas

### D1. Un fichero de lógica pura nuevo, en inglés

**Elegido**: `weekly-goal-logic.js`, con la misma guarda `module.exports` que usa `heatmap-logic.js`, para que el navegador y Node usen el mismo fichero.

**Descartado**: meter el cálculo dentro de `app.js`. Sería la opción más rápido, pero escribiría código nuevo en español en un fichero que es deuda, y lo dejaría sin probar de forma aislada.

### D2. Reutilizar las reglas del mapa de calor, sin duplicarlas

**Elegido**: un único enlace al principio del fichero nuevo, resuelto una sola vez al cargar:

- En el **navegador** las funciones de `heatmap-logic.js` ya son globales, pero el enlace las toma **de `window` explícitamente** (`window.mondayOf`, `window.isValidSession`, `window.parseIso`). Referenciarlas como identificadores sueltos funcionaría en el navegador y **fallaría bajo Node**, donde no existe ese ámbito global.
- Bajo **Node** el enlace las trae con `require('./heatmap-logic.js')`.

**Descartado**: copiar `parseIso`, `addDays`, `mondayOf` e `isValidSession`. Sería más fácil de leer al principio, pero crearía **dos reglas de validez** y dos criterios de semana. RF-5.1 y RF-6.1 exigen literalmente el mismo criterio, y dos copias divergirían sin que ninguna prueba lo detecte.

**Descartado**: extraer las utilidades a un tercer fichero común. Obliga a tocar `heatmap-logic.js`, que ya está en producción (constitución 7).

### D3. Dos ficheros nuevos, lógica e interfaz separados

**Elegido**: `weekly-goal-logic.js` y `weekly-goal-ui.js`, igual que hizo el mapa de calor.

**Descartado**: un solo fichero con lógica y pintada mezclados. Viola la constitución 3 aunque el fichero sea único.

### D4. La cifra de la semana la calcula y la muestra la propia funcionalidad

**Elegido**: `weekly-goal-ui.js` calcula los minutos con `sumWeekMinutes` y los pinta en la línea del objetivo. En `app.js` solo se **quita la llamada** que pintaba la estadística "Esta semana", porque su nodo desaparece con RF-8.2.

**Comprobado antes de decidir**: la llamada está en `app.js:216` y el nodo es `index.html:38`. No hay ningún otro uso.

**Descartado**: que `app.js` siga calculando y pintando los minutos y se los pase a la interfaz. Serían dos cálculos que tienen que coincidir siempre, y RF-5.1 exige un único origen.

**Descartado**: borrar aquí `calcularMinutosSemana`. Esta spec no repara el fichero heredado: dejar la función sin uso es consecuencia directa de RF-8.2, y **borrarla es de la spec 003**, dentro de su excepción.

### D5. La lectura del almacenamiento es una función pura que recibe el texto

**Elegido**: `readSessionStore(rawText)` recibe lo que hay escrito en el almacenamiento y devuelve `{ status, sessions }`. Quien llama hace el `getItem`.

**Descartado**: una función que lea `localStorage` por su cuenta. Sería más corta, pero no se podría probar: `node --test` no tiene almacenamiento del navegador. Con esta forma, los tres estados del almacenamiento se prueban con tres cadenas de texto.

**Consecuencia**: esta spec crea la lectura pura y la usa **solo el objetivo**. Que el mapa y la lista la compartan es de la spec 003, porque eso sí exige tocar el fichero heredado.

### D6. El campo del objetivo es de texto, no de número

**Elegido**: `<input type="text" inputmode="numeric">`, y el criterio de parseo es el de `parseGoalInput`.

**Descartado**: `type="number"`. El navegador normaliza lo que se escribe y puede entregar "1e3" o una cadena vacía según el caso, de modo que la decisión de qué es válido pasaría a estar en el navegador y no en la spec. Con texto, el criterio es el de RF-2.4 y está probado.

### D7. El objetivo no afirma nada que el dato no demuestre

**Elegido**: la interfaz coloca cifras dentro de literales fijos y decide **qué línea mostrar** a partir del `state` que devuelve la lógica, nunca comparando números por su cuenta.

**Descartado**: que la interfaz esconda lo que no debe verse comparando valores. Así, cambiar el criterio de la lógica no cambiaría lo que dice la pantalla.

### D8. Avisos separados: ilegibles en la tarjeta, no válidas en el mapa

**Elegido**: el aviso de sesiones **no válidas** lo sigue pintando solo el mapa, con su texto y su recuento (RF-6.3). El aviso de sesiones **ilegibles** lo pinta el objetivo, porque nadie más lo muestra (RF-10.5).

**Descartado**: un aviso único que mezclara los dos casos. Son cosas distintas: una sesión descartada se puede corregir en la lista; un almacén ilegible, en esta spec, es solo un estado de la lectura del objetivo.

**Descartado**: duplicar el aviso de no válidas en la tarjeta. La pantalla mostraría dos recuentos de lo mismo y podría divergir (RF-6.4).

### D9. Un único punto de lectura del reloj dentro de esta funcionalidad

**Elegido**: `readTodayIso()` en `weekly-goal-ui.js`, que es la única lectura de reloj que pertenece a esta funcionalidad. El resto de lecturas del proyecto se quedan donde están (RF-4.5).

**Descartado**: `setInterval` para repintar. Contradice RF-4.8 y mantiene la página despierta sin necesidad.

**Descartado**: llamar a `hoyComoString()` de `app.js`. Sería una lectura más dentro de la funcionalidad y además un acoplamiento con código en español.

### D10. La interfaz se expone como `window.weeklyGoal`, con arranque propio

**Elegido**: un único objeto con `render()`, siguiendo el patrón que ya usa `window.heatMap`. Se asigna **al final de su propio arranque**, y ese arranque se ejecuta al cargarse el script, no cuando la aplicación termine de pintar. `app.js` solo avisa con `render()`; no le pasa datos ni conoce su interior.

Por qué el arranque propio (RF-10.7): la lectura heredada de `app.js` lanza con un almacenamiento que no se puede interpretar, y como `app.js` la usa al cargar (`app.js:386`), **`renderizar()` no llega a terminar** y el bloque del objetivo no se pintaría nunca. Con arranque propio, el objetivo se pinta antes y con independencia: si el resto de la aplicación se detiene, el objetivo sigue en pantalla con 0 minutos registrados y su aviso.

**Cómo conviven las dos rutas** (RF-10.8), y por qué ninguna rompe a la otra:

| Ruta | Quién la dispara | Qué hace | Si la otra falla |
|---|---|---|---|
| **Arranque propio** | El propio script, al cargarse | Lee el almacenamiento con `readSessionStore`, pinta el bloque y asigna `window.weeklyGoal` | No depende de nada, así que no se puede interrumpir |
| **Refresco** | La llamada al final de `renderizar()` en `app.js` | Vuelve a leer y **repinta el bloque entero por encima** | Si `renderizar()` lanza antes de llegar, el bloque conserva lo que pintó el arranque |

Las dos pintan **el bloque entero**, nunca partes sueltas: así, si una ruta se queda a medias, no quedan restos de la otra. Y como las dos usan la misma lectura pura y la misma función de pintado, **no pueden mostrar cosas distintas** para los mismos datos.

**Descartado**: depender solo de `renderizar()`, como estaba antes de esta corrección. Es exactamente lo que hace falso a RF-10.3.

**Descartado**: eventos propios para avisar de los cambios. Más piezas que mantener sin ninguna ventaja.

### D11. El toque en el fichero heredado son dos líneas

**Elegido**: en `app.js`, quitar la llamada a la estadística que desaparece y añadir la llamada al objetivo. Dos líneas, nada más. El arranque propio **no necesita tocar `app.js`** porque vive dentro del script de la interfaz del objetivo.

**Descartado**: arreglar de paso la lectura, la lista o la función muerta. Esas tres cosas están ahora en la **spec 003**, con su excepción declarada. Esta spec no pide permiso para nada de eso: solo hace lo que exigen RF-8.2 y RF-3.9.

---

## 7. Estrategia de tests

### 7.1 Mecánica

- Un fichero de prueba: `weekly-goal.test.js`, ejecutado con `node --test`, sin instalar nada.
- Sin `package.json`: Node trata los `.js` como CommonJS y la guarda de exportación funciona igual que en el mapa de calor.
- Los tests **requieren** `weekly-goal-logic.js` y `session-list-logic.js`, que a su vez requieren `heatmap-logic.js` para las reglas compartidas.
- Node no recoge los ficheros de lógica ni los de interfaz como ficheros de prueba.

### 7.2 Bloques de pruebas

| Bloque | Qué verifica | RF |
|---|---|---|
| `readSessionStore` vacío | `null`, cadena vacía y cadena de espacios dan `empty` con lista vacía | RF-10.1, RF-10.2 |
| `readSessionStore` ilegible | Texto que no es interpretable, un objeto, un número y un texto dan `unreadable` con lista vacía, sin lanzar | RF-10.1, RF-10.3 |
| `readSessionStore` lista | Una lista con sesiones válidas y malformadas da `ok` y **conserva los malformados** | RF-10.4 |
| `weekStartIso` | Lunes de una semana que empieza en lunes, una que empieza en domingo, y el 1 de enero | RF-1.2, RF-4.1 |
| `sumWeekMinutes` alcance | Solo cuenta desde el lunes hasta hoy: lunes cuenta, semana anterior no, futuro no | RF-1.1, RF-1.4, RF-1.5 |
| `sumWeekMinutes` filtro | Minutos cero, negativos, con decimales, de 1441 y fecha futura no suman | RF-6.1, RF-5.5 |
| `sumWeekMinutes` bordes | Domingo cuenta los siete días; sin sesiones válidas devuelve 0 | RF-1.6, RF-1.7 |
| `sumWeekMinutes` suma | Varias sesiones del mismo día suman; las duplicadas idénticas se cuentan todas | RF-5.1 |
| `parseGoalInput` aceptadas | "30", " 30 ", "030", "1" y "10080" | RF-2.4, RF-2.5 |
| `parseGoalInput` rechazadas | "", "0", "1e3", "+30", "30.0", "30,5", "30 min", "-30", "10081", número sin texto | RF-2.4, RF-2.5, RF-2.6 |
| `resolveGoal` | Sin guardado y vacío dan 30 por defecto **sin** aviso; texto, decimales y fuera de rango dan 30 **con** aviso; válido da su valor sin aviso | RF-2.3, RF-7.3, RF-7.7 |
| `computeGoalProgress` | Por debajo, exactamente igual, un minuto por encima y muy por encima | RF-3.2, RF-3.3, RF-3.5, RF-3.8 |
| `computeGoalProgress` proporción | Nunca menor que 0 ni mayor que 1 | RF-3.5 |
| `buildWeeklyGoalView` | Estados completos, marca de valor por defecto, avisos y `weekStartIso` | RF-3.1, RF-3.6, RF-3.7, RF-10.3, RF-10.5 |
| `buildWeeklyGoalView` cambio a mitad de semana | Subir el objetivo hace retroceder la proporción y bajar el objetivo la hace avanzar | RF-3.6, RF-3.7 |
| **Determinismo** | Dos llamadas con la misma fecha dan el mismo resultado; el resultado no cambia al alterar la fecha del sistema | RF-1.3, RNF-5 |

### 7.3 Regresiones que no pueden faltar

| Prueba | Por qué |
|---|---|
| Cambio de hora de verano, último domingo de marzo y de octubre | La semana no se desplaza un día ni con el cambio de 23 horas ni con el de 25 |
| 29 de febrero en año bisiesto, si cae en la semana | El día existe y cuenta |
| Paso del 31 de diciembre al 1 de enero | La semana que cruza el año cuenta como una sola |
| Una sesión con 1440 minutos exactos | Es válida: no supera el límite de un día |
| Una sesión con 1441 minutos | Se excluye y no rompe nada |
| Una lista con un elemento `null` en mitad de sesiones válidas | Se excluye del cálculo y **las demás sesiones siguen sumando** (RF-10.4) |

### 7.4 Verificación en navegador

Los tests cubren la lógica, no el DOM. Esta spec se queda con la **verificación mínima** que `AGENTS.md` exige para cualquier pantalla nueva, y todo lo demás está en la spec 003:

- Abrir `index.html` sin servidor, a 1280 px y a 375 px, **con un almacenamiento legible y válido**.
- El bloque del objetivo se ve completo y funciona en las dos anchuras.
- Recorrer el bloque con el teclado y comprobar que el lector de pantalla anuncia el progreso con los literales de RF-9.1.
- Confirmar que la consola no muestra errores.
- Comprobar la opción de movimiento reducido.
- Revisar que el código nuevo está en inglés y los literales en español.

Lo que **no** se verifica aquí, y va a la spec 003: los estados de almacenamiento ilegible y con elementos malformados, la medición de rendimiento con 2000 sesiones y la revisión completa del idioma y de la documentación.

---

## 8. Matriz de cobertura

| RF | Dónde se resuelve |
|---|---|
| RF-1.1 | `sumWeekMinutes` |
| RF-1.2 | `weekStartIso` con `mondayOf` del mapa |
| RF-1.3 | Todas las funciones reciben `todayIso`; bloque de determinismo |
| RF-1.4 | `sumWeekMinutes` descarta fechas futuras |
| RF-1.5 | `sumWeekMinutes` incluye el lunes |
| RF-1.6 | `sumWeekMinutes` con `todayIso` de domingo |
| RF-1.7 | `sumWeekMinutes` con lista sin sesiones válidas |
| RF-2.1 | `weekly-goal-ui.js`, botón y formulario |
| RF-2.2 | `resolveGoal` devuelve un único valor |
| RF-2.3 | `DEFAULT_GOAL_MINUTES` en `resolveGoal` |
| RF-2.4 | `parseGoalInput` con la prueba de formas |
| RF-2.5 | `MIN_GOAL_MINUTES` y `MAX_GOAL_MINUTES` |
| RF-2.6 | `weekly-goal-ui.js` no guarda con el campo vacío y muestra el mensaje |
| RF-2.7 | `weekly-goal-ui.js` escribe y vuelve a pintar |
| RF-2.8 | El formulario se puede abrir en cualquier momento |
| RF-2.9 | `weekly-goal-ui.js` no pide confirmación adicional |
| RF-2.10 | `isDefaultGoal` decide la etiqueta |
| RF-2.11 | `resolveGoal` sin almacenamiento |
| RF-3.1 | `buildWeeklyGoalView` entrega el modelo y la interfaz lo pinta |
| RF-3.2 | `computeGoalProgress`, estado en curso |
| RF-3.3 | `computeGoalProgress`, estado cumplido, y `weekly-goal-ui.js` retira las dos líneas |
| RF-3.4 | `weekly-goal-ui.js` elige la línea según `state` |
| RF-3.5 | `ratio` acotado a 1 |
| RF-3.6 | `buildWeeklyGoalView` con el objetivo nuevo y los minutos ya registrados |
| RF-3.7 | Igual, en los dos sentidos |
| RF-3.8 | `computeGoalProgress` con objetivo menor o igual |
| RF-3.9 | Aviso desde `renderizar()` en `app.js` |
| RF-3.10 | `sumWeekMinutes` tras editar la fecha de una sesión |
| RF-3.11 | Literales de RF-9.1, todos con "registrados" |
| RF-4.1 | `weekStartIso` y `sumWeekMinutes` |
| RF-4.2 | `resolveGoal` con almacenamiento |
| RF-4.3 | `resolveGoal` es puro: el mismo valor antes y después |
| RF-4.4 | `sumWeekMinutes` con sesiones del nuevo lunes |
| RF-4.5 | `readTodayIso` en `weekly-goal-ui.js` |
| RF-4.6 | Escucha de foco y llamada desde `renderizar()` |
| RF-4.7 | Comparación de la semana leída con la que había |
| RF-4.8 | Ausencia de temporizador; se comprueba en navegador |
| RF-4.9 | No hay ninguna escritura por semana |
| RF-5.1 | Un solo `sumWeekMinutes` y una sola pantalla |
| RF-5.2 | Mismo filtro en el modelo de vista |
| RF-5.3 | El bloque del objetivo no registra eventos de sesión |
| RF-5.4 | `weekly-goal-ui.js` no toca sesiones ni las otras cifras |
| RF-5.5 | `sumWeekMinutes` excluye no válidas; criterio 6 |
| RF-6.1 | `isValidSession` compartido del mapa |
| RF-6.2 | `sumWeekMinutes` con elementos malformados |
| RF-6.3 | La interfaz del objetivo no pinta aviso de no válidas |
| RF-6.4 | El recuento lo sigue pintando el mapa |
| RF-6.5 | Plural y singular, en el mapa |
| RF-6.6 | Literales de RF-9.1; no existe texto que afirme ausencia de estudio |
| RF-6.7 | Texto del mapa, sin cambios |
| RF-6.8 | No se toca el texto del mapa |
| RF-7.1 | `GOAL_STORAGE_KEY` nueva |
| RF-7.2 | Ninguna escritura sobre la clave de sesiones |
| RF-7.3 | `resolveGoal` con almacenamiento vacío |
| RF-7.4 | Escritura y lectura de la clave del objetivo |
| RF-7.5 | `weekly-goal-ui.js` captura el fallo de escritura |
| RF-7.6 | `resolveGoal` no escribe nada |
| RF-7.7 | `resolveGoal` con texto, decimales o fuera de rango, más el aviso |
| RF-7.8 | `resolveGoal` no persiste el valor por defecto |
| RF-8.1 | Bloque dentro de `.racha-stats` |
| RF-8.2 | Se retira el `stat` de "Esta semana" y su llamada en `renderizar()` |
| RF-8.3 | `hidden` en el formulario y en los mensajes |
| RF-8.4 | Apertura del formulario con el valor vigente y foco en el campo |
| RF-8.5 | Guardar y cancelar |
| RF-8.6 | Intro envía el formulario; ningún otro atajo |
| RF-8.7 | No se añade sección ni se altera el orden |
| RF-9.1 | Tabla de `weekly-goal-ui.js` con los literales exactos |
| RF-9.2 | Ninguna cifra lleva la palabra "minutos" |
| RF-9.3 | El mensaje de objetivo no válido la usa en prosa |
| RF-9.4 | Estado cumplido en la interfaz |
| RF-9.5 | Estado en curso en la interfaz |
| RF-9.6 | Cancelar limpia el mensaje |
| RF-9.7 | Todos los literales hablan de minutos registrados |
| RF-10.1 | `readSessionStore` |
| RF-10.2 | `readSessionStore` estado vacío |
| RF-10.3 | `readSessionStore` estado ilegible y `showSessionsNotice` |
| RF-10.4 | `readSessionStore` conserva los malformados y `sumWeekMinutes` los excluye |
| RF-10.5 | La interfaz pinta el aviso ilegible y ningún aviso de no válidas |
| RF-10.6 | `readSessionStore` no escribe nada |
| RF-10.7 | Arranque propio de `weekly-goal-ui.js`, que lee con `readSessionStore` y pinta antes que `app.js` |
| RF-10.8 | Las dos rutas pintan el bloque entero: la segunda repinta encima de la primera |
| RF-10.9 | Con la lectura ilegible, el bloque solo informa y no afirma nada sobre el estudio |
| RNF-1 | CSS con comprobación a 375 y 1280; criterios 17 y 22 |
| RNF-2 | Estado cumplido con texto y forma de barra |
| RNF-3 | Foco visible, `role="progressbar"` con los literales de RF-9.1 |
| RNF-4 | Los dos ficheros de lógica sin DOM ni almacenamiento |
| RNF-5 | Ninguna función de cálculo lee el reloj; bloque de determinismo |
| RNF-6 | `weekly-goal.test.js` con `node --test` |
| RNF-7 | Sin servidor ni build; la medición de rendimiento es de la spec 003 |
| RNF-8 | Ninguna escritura sobre los datos de sesiones |
| RNF-9 | Literales de RF-9.1 en español |
| RNF-10 | Transiciones dentro de `prefers-reduced-motion` |
| RNF-11 | Código y tests nuevos en inglés; criterio 19 |
| RNF-12 | En `app.js` se tocan dos líneas, ni una más; criterio 20 |

---

## 9. Orden de ejecución

1. `session-list-logic.js` y `weekly-goal-logic.js` completos, **antes de tocar la interfaz**.
2. `weekly-goal.test.js` hasta que todos los bloques de 7.2 y 7.3 estén en verde. Si hay alguna en rojo, no se continúa (constitución 4).
3. Orden de carga de los scripts en `index.html`, con `heatmap-logic.js` primero y la interfaz después de su lógica (2.3).
4. Bloque del objetivo en `index.html` y `styles.css`.
5. `weekly-goal-ui.js`.
6. Quitar la llamada a la estadística en `renderizar()` y añadir el aviso al objetivo. El arranque propio del objetivo se escribe junto con la interfaz, en el paso 5.
7. Verificación mínima en navegador según 7.4.
8. `AGENTS.md` y `MEMORY.md`.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Duplicar la regla de validez al copiar utilidades del mapa crearía dos criterios que divergen sin que nada lo detecte | D2: enlace a las reglas compartidas leyendo de `window` en el navegador y con `require` bajo Node, más pruebas que fijan el mismo criterio en ambos caminos |
| Que la interfaz empiece a calcular por su cuenta y diga algo falso | D7: la interfaz solo coloca cifras en literales; el modelo de vista ya trae `state` y `ratio` |
| Que la línea que se quita en `app.js` se olvide y la página lance | D4 y D11: el cambio está acotado a dos líneas y el criterio 20 lo comprueba |
| El campo de texto dejar pasar algo raro por teclado móvil | `parseGoalInput` es la única puerta y está probada con las diez formas de la spec |
| La barra no distinguir el estado cumplido sin color | RNF-2: el texto cambia y la barra cambia de forma además de color |
| Una fecha guardada sin cero a la izquierda (`"2026-1-5"`) | **Riesgo conocido y aceptado**: `parseIso` la acepta, pero la comparación de textos de 4.3 la dejaría fuera de la suma en silencio. No es alcanzable desde la aplicación, porque el control de fecha del formulario siempre genera el formato con ceros. Se documenta aquí porque arreglarlo exigiría tocar código heredado, que es de la spec 003 |
| Dejar la aplicación sin verificar en móvil | 7.4 y el criterio 17: la verificación mínima no se delega a la spec 003 |

---

## 11. Fuera de este plan

No se implementa nada de la sección 8 de la spec (fuera de alcance). La reparación del almacenamiento heredado, el pintado robusto de la lista y el borrado del código muerto están en `specs/003-resilient-session-list/`, con su excepción declarada. No se corrige el texto del mapa de calor sobre días sin registro (RF-6.8): es una spec de cambio aparte. No se traduce `app.js`.