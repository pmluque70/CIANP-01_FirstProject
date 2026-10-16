# Plan 001 — Mapa de calor de estudio

Spec: `specs/001-heat-map/spec.md`
Constitution: `docs/constitution.md`

---

## 1. Cómo se respeta la constitución

| Principio | Cómo se cumple en este plan |
|---|---|
| **1. Simplicidad primero** | Sin dependencias, sin build, sin `package.json`. Los ficheros se cargan con `<script src>` clásico, sin `type="module"`, para que `file://` siga funcionando con doble clic. |
| **2. La spec manda** | La matriz de la sección 8 traza cada RF a la parte del plan que lo cubre. No se añade comportamiento que no esté en la spec. |
| **3. Lógica separada de interfaz** | `heatmap-logic.js` no toca el DOM ni el localStorage. Toda función recibe `todayIso` como parámetro y ninguna lee el reloj del sistema. |
| **4. Tests como puerta** | `heatmap.test.js` con `node --test`, sin instalar nada. La lógica se prueba antes de tocar la interfaz. |
| **5. Datos sagrados** | El mapa solo lee. Las sesiones excluidas se omiten al pintar, nunca se borran ni se modifican (RF-11). |
| **6. Idioma** | **Pilar, no decisión.** Código y tests en inglés, interfaz en español. `app.js` queda en español como deuda. Ver D7. |
| **12. Spec sin stack** | Este plan es donde aparecen los nombres de fichero, la estructura y el algoritmo. |

---

## 2. Ficheros

### 2.1 Ficheros nuevos

| Fichero | Responsabilidad | Cubre |
|---|---|---|
| `heatmap-logic.js` | **Solo lógica pura.** Validación de sesiones, suma de minutos por día, cálculo de nivel de intensidad, construcción de la rejilla de 52 semanas, etiquetas de mes, conteo de exclusiones y estado de detalle de un día. Sin DOM, sin localStorage, sin `new Date()` sin argumentos. | RF-1.2 a RF-1.6, RF-2, RF-3, RF-4, RF-5.2/5.3/5.8/5.9, RF-7.2/7.3, RF-9.3 a RF-9.8 |
| `heatmap-ui.js` | **Solo interfaz.** Lee las sesiones del almacenamiento, pide la rejilla a la lógica, pinta celdas, leyenda, etiquetas, panel de detalle y aviso. Gestiona scroll, filtro, eventos de puntero, toque y teclado. | RF-1.1, RF-4.4/4.5, RF-5.1, RF-5.4 a RF-5.7, RF-6, RF-7.1, RF-8, RF-9.1/9.2/9.9, RF-10.2/10.3, RNF-1, RNF-2, RNF-8 |
| `heatmap.test.js` | Pruebas de la lógica con `node --test`. No toca interfaz. | RNF-3, RNF-3b, RNF-4 |

### 2.2 Ficheros modificados

| Fichero | Cambio | Cubre |
|---|---|---|
| `index.html` | Sección nueva del mapa entre la tarjeta de racha y el formulario. Campos del filtro, contenedor con scroll, rejilla, leyenda, panel de detalle y hueco del aviso. | RF-1.1, RF-5.5, RF-6.1, RF-7.1, RF-9.1, RF-9.2 |
| `styles.css` | Estilos de rejilla, celdas por nivel, leyenda, etiquetas de mes, panel, scroll con señales de borde y estados de foco. | RNF-1, RNF-2, RNF-8 |
| `app.js` | Un único punto de enganche: al final de `renderizar()` se notifica al mapa. Se toca lo mínimo. | RF-10.2, RF-11.3 |
| `AGENTS.md` | Estructura de ficheros y regla de idioma para código nuevo. | Constitución 6 |
| `MEMORY.md` | Estado del proyecto y decisiones de la spec 001. | — |

> `app.js` **no se reescribe**. Solo se le añade una llamada. La constitución exige cambios pequeños y el código actual funciona.

---

## 3. Funciones puras de lógica

Todas viven en `heatmap-logic.js`. Todas son puras: mismos datos y misma `todayIso` producen el mismo resultado, sin importar cuándo se ejecuten (RF-1.6, RNF-3b).

| Función | Contrato | Cubre |
|---|---|---|
| `isValidSession(session, todayIso)` | Devuelve si la sesión es válida: fecha no posterior a hoy y minutos enteros entre 1 y 1440. Tolera cualquier forma de entrada sin lanzar errores. | RF-4.1, RF-4.2, RF-4.3, RF-2.1 |
| `countExcludedSessions(sessions, todayIso)` | Número de sesiones que quedan fuera por cualquier motivo de RF-4. | RF-4.4, RF-4.5 |
| `intensityLevel(totalMinutes)` | Devuelve el nivel 0 a 4 según los tramos fijos. El 0 corresponde a "sin estudio". | RF-2.2, RF-2.3, RF-3.1 |
| `sumMinutesByDate(sessions, todayIso)` | Mapa de fecha a minutos, sumando **solo sesiones válidas**. | RF-2.1, RF-10.1 |
| `computeWindow(todayIso)` | Devuelve la fecha del lunes de la semana que contiene hoy y la del lunes 51 semanas antes. Define el inicio y el fin de la rejilla. | RF-1.2, RF-1.4, RF-8.6, RF-9.6 |
| `buildHeatMap(sessions, todayIso, range)` | **Función principal.** Devuelve la rejilla completa lista para pintar: 52 columnas, 7 filas, nivel de cada día, celdas nulas donde no toca representar, etiquetas de mes y número de exclusiones. `range` es opcional y por defecto es nulo. | RF-1.1 a RF-1.6, RF-2, RF-3, RF-4, RF-7.2, RF-7.3, RF-9.3 a RF-9.8 |
| `monthLabelsFor(weeks)` | Deriva de la rejilla las etiquetas de mes, una por mes y en orden, omitiendo las que no caben unas junto a otras. | RF-7.2, RF-7.3 |
| `detailForDate(sessions, dateIso, todayIso)` | Estado de un día: total de minutos válidos, cuántas sesiones válidas, cuántas excluidas y un estadoamong `no-session`, `invalid-only`, `partial` o `studied`. | RF-5.2, RF-5.3, RF-5.8, RF-5.9 |
| `parseRange(fromIso, toIso)` | Valida un rango: devuelve el rango aplicable o `null` si no procede. Un solo campo, o final anterior a inicio, produce `null`. | RF-9.4, RF-9.5 |

### 3.1 Forma de la rejilla devuelta

Contrato conceptual, no código:

```
{
  columns: 52,
  rows: 7,
  weeks: [                  // 52 entradas, la primera es la más antigua
    {
      monday: "AAAA-MM-DD",
      days: [               // exactamente 7 ranuras, índice 0 = lunes
        { date, row, level, totalMinutes, state }   // celda real
        null                                          // día no representado
        ...
      ]
    }
  ],
  monthLabels: [ { columnIndex, text } ],
  excludedCount: entero
}
```

Una ranura `null` significa que ese día **no se representa**: está fuera de la ventana, es futuro, o queda fuera del filtro. La interfaz simplemente no pinta celda ahí.

---

## 4. Algoritmo en pseudocódigo

### 4.1 `buildHeatMap(sesiones, todayIso, rango)`

```
funcion buildHeatMap(sesiones, todayIso, rango):

    # --- Ventana de 52 semanas -------------------------------------
    hoy            := fecha desde "AAAA-MM-DD" en hora local
    lunesHoy       := hoy - diaDeSemana(hoy)            # lunes de esta semana
    lunesInicio    := lunesHoy - 51 semanas
    ventanaFin     := hoy                                # no hay días futuros

    # --- Acotar el rango al filtro y a la ventana -----------------
    rangoAplicado  := parseRange(fechaInicio, fechaFin)   # null si no procede
    desde          := lunesInicio
    hasta          := ventanaFin
    si rangoAplicado no es null:
        desde := max(Desde, desde)
        hasta := min(hasta, hasta)
        si desde > hasta:
            desde := hasta + 1 día        # rango sin días: rejilla vacía

    # --- Acumular minutos por día ---------------------------------
    minutosPorDia  := mapa vacío
    exclusiones    := 0
    para cada sesion en sesiones:
        si la sesion no tiene forma reconocible:
            exclusiones := exclusiones + 1
            continuar
        si sesion.fecha no es una fecha válida:
            exclusiones := exclusiones + 1
            continuar
        si no es Valida(sesion, todayIso):
            exclusiones := exclusiones + 1
            continuar
        minutosPorDia[sesion.fecha] := minutosPorDia[sesion.fecha] + sesion.minutos

    # --- Construir 52 columnas x 7 filas --------------------------
    semanas := lista vacía
    para i desde 0 hasta 51:                      # i = 0 es la más antigua
        lunes := lunesInicio + i semanas
        dias  := lista de 7 posiciones nulas

        para fila desde 0 hasta 6:                # fila 0 = lunes, 6 = domingo
            fecha := lunes + fila días

            # ¿Esta celda se representa?
            si fecha < desde:            seguir      # antes de la ventana o del filtro
            si fecha > hasta:            seguir      # futuro o fuera del filtro
            si fecha > hoy:              seguir      # RF-1.4, nunca días futuros

            minutos := minutosPorDia[fecha] si existe, si no 0
            dias[fila] := {
                fecha        : fecha,
                fila         : fila,
                minutos      : minutos,
                nivel        : intensityLevel(minutos),
                estado       : vacio | estudiado | parcial | invalido
            }

        semanas := semanas + { lunes: lunes, dias: dias }

    # --- Etiquetas de mes ------------------------------------------
    etiquetas := []
    mesVigente := ninguno
    for i, semana in semanas:
        primerDiaRepresentado := primer día de semana.dias que no es nulo
        si primerDiaRepresentado no existe: continuar
        mes := primerDiaRepresentado.mes
        si mes != mesVigente:
           candidata := { indiceColumna: i, texto: nombreCorto(mes) }
            si no cabe junto a la última etiqueta aceptada:
                continuar                     # RF-7.3, omitir antes que solapar
            etiquetas := etiquetas + candidato
            mesVigente := mes

    devolver {
        columnas     : 52,
        filas        : 7,
        semanas      : semanas,
        etiquetasMes : etiquetas,
        exclusiones  : exclusiones
    }
```

### 4.2 `intensityLevel(minutos)`

```
funcion intensityLevel(minutos):
    si minutos <= 0:              devolver 0     # sin estudio
    si minutos <= 29:             devolver 1     # día breve
    si minutos <= 59:             devolver 2     # día normal
    si minutos <= 119:            devolver 3     # buen día
    devolver 4                                   # día intenso
```

> Los umbrales son **constantes literales**. No se calculan a partir de los datos del usuario (RF-2.3). Por eso son testables de forma exhaustiva.

### 4.3 `parseRange(desdeIso, hastaIso)`

```
funcion parseRange(desdeIso, hastaIso):
    si desdeIso está vacío o hastaIso está vacío:
        devolver null              # RF-9.5, un solo campo no filtra
    desde := fecha(desdeIso)
    hasta := fecha(hastaIso)
    si hasta < desde:
        devolver null              # RF-9.4, rango inválido
    devolver { desde: desde, hasta: hasta }
```

### 4.4 Cálculo de la semana

```
funcion lunesDe(fecha):
    # día de semana local: 0 = domingo ... 6 = sábado
    dia := diaDeSemanaDe(fecha)     # se calcula en hora local, NUNCA en UTC
    si dia == 0:  devolver fecha - 6 días     # domingo -> lunes anterior
    si dia == 1:  devolver fecha             # ya es lunes
    devolver fecha - (dia - 1) días
```

> Todo el cálculo de días usa **suma y resta de días en hora local**, nunca milisegundos ni `toISOString()`. Es el error que ya se corrigió una vez en este proyecto y no debe volver.

---

## 5. Cómo se pinta en la interfaz

### 5.1 Estructura del HTML

Sección insertada entre la tarjeta de racha y el formulario (decisión de la sección 9 de la spec), con esta jerarquía:

1. Título de la sección.
2. Filtro: dos campos de fecha y una acción para retirarlo.
3. Contenedor con desplazamiento lateral, que contiene:
   - Fila de etiquetas de mes.
   - Rejilla de 52 columnas por 7 filas.
4. Leyenda con los cinco tramos.
5. Panel de detalle bajo la rejilla.
6. Hueco reservado para el aviso de sesiones descartadas.

### 5.2 La rejilla

- Se construye como una **rejilla CSS** con `grid-auto-flow: column` y 7 filas, de forma que las celdas se rellenan de arriba abajo y luego hacia la derecha: la primera columna es la semana más antigua y la última la más reciente.
- Cada celda recibe un atributo `data-level` con el valor 0 a 4. El color lo resuelve el CSS con variables, de modo que la lógica no sabe nada de colores (separación constitution 3).
- Las ranuras nulas **no generan elemento**: la rejilla simplemente tiene menos celdas en esa posición.
- La rejilla se marca semánticamente como `grid` con filas y celdas ARIA.

### 5.3 El desplazamiento

- El contenedor tiene desplazamiento horizontal nativo. No hay controles de navegación, porque el scroll ya es necesario para ver las 52 columnas (RF-8.1).
- Al pintar por primera vez, el contenedor se posiciona en el extremo derecho, que es donde están los días recientes (RF-8.2).
- Las señales de borde se resuelven en CSS con sombras o degradados en los extremos, visibles solo cuando queda contenido por explorar (RF-8.3).
- El desplazamiento vertical de la página no se ve afectado porque solo se desplaza el eje horizontal (RF-8.5).

### 5.4 El detalle

| Situación | Qué se muestra |
|---|---|
| Puntero sobre una celda | Detalle flotante con fecha y minutos (RF-5.1) |
| Toque en una celda | Se actualiza el panel fijo bajo la rejilla (RF-5.5, 5.7) |
| Panel sin selección | Instrucción para tocar un día (RF-5.6) |
| Día sin ninguna sesión | "No se estudió ese día" (RF-5.2) |
| Día solo con sesiones descartadas | "Registro descartado por datos no válidos" (RF-5.8) |
| Día con válidas y descartadas | Total de las válidas + aviso parcial (RF-5.9) |

El texto lo decide el `estado` que devuelve la lógica, nunca la interfaz. Así es imposible que la interfaz afirme algo que los datos no demuestran.

### 5.5 Accesibilidad

- La rejilla es **un único punto de tabulación**, no 364. Dentro se navega con las flechas del teclado mediante un `tabindex` que se desplaza de celda en celda.
- Cada celda expone su fecha y sus minutos como etiqueta accesible, y es alcanzable con `Tab` desde la rejilla (RNF-2b).
- Cada nivel de color se distingue también por tono, no solo por matiz (RNF-2).

### 5.6 Reacción a cambios de datos

`renderizar()` en `app.js` ya se invoca al añadir, editar o borrar. Se le añade una llamada notify al mapa, que vuelve a pedir la rejilla a la lógica y vuelve a pintar (RF-10.2, RF-11.3). Si el mapa no está en pantalla, la llamada no hace nada.

---

## 6. Decisiones técnicas

### D1. Cómo comparten lógica el navegador y Node

**Elegido**: un script plano con una guarda al final que solo exporta cuando existe `module`, es decir, únicamente cuando lo carga Node. En el navegador la guarda es falsa y las funciones quedan como globales.

**Descartado**: módulos ES con `type="module"`. Bloqueados por el navegador al abrir con `file://`, romperían la constitución 1.

**Descartado**: duplicar la lógica en los tests. Los tests verificarían una copia, no el código real: no valdrían nada.

### D2. Dos ficheros en lugar de uno

**Elegido**: `heatmap-logic.js` y `heatmap-ui.js` separados. Es la exigencia literal de la constitución 3.

**Descartado**: todo dentro de `app.js`. Ya tiene más de 300 líneas y mezclaría cálculo con DOM.

**Descartado**: un único `heatmap.js` con lógica y pintada mezclados. Viola la constitución 3 aunque el fichero sea único.

### D3. Rejilla de CSS frente a tabla

**Elegido**: rejilla CSS con `grid-auto-flow: column` y roles ARIA de grid.

**Descartado**: `<table>` nativa. Aporta semántica gratis, pero hace falta fijarla para que la primera columna siga visible al desplazar, y el control de la zona desplazable es más frágil. Con ARIA se controla igual desde el lado accesible.

### D4. Estructura anidada de semanas

**Elegido**: `buildHeatMap` devuelve las 52 semanas, cada una con 7 ranuras.

**Descartado**: lista plana de días y cálculo de posición en el momento de pintar. Menos memoria, pero el cálculo de fila y columna en la interfaz es propenso a errores de cambio de hora, y además no sería testeable.

### D5. Etiquetas de mes calculadas en la lógica

**Elegido**: las devuelve `monthLabelsFor`, con la regla de omitir la que no cabe ya resuelta y probada.

**Descartado**: calcularlas al pintar. Sería lógica escondida en la interfaz, sin tests, justo lo que la constitución 3 prohíbe.

### D6. Conteo de descartes en la lógica

**Elegido**: `countExcludedSessions` como función pura.

**Descartado**: contarlas en la interfaz. Mismo problema que D5.

### D7. Idioma del código nuevo

**Ya no es una decisión: es un pilar (constitución 6).** Código en inglés, interfaz en español, y los tests también en inglés porque son código.

**Consecuencia asumida**: `app.js` está en español y quedará en español. Conviven los dos idiomas y eso es deuda, no un error de esta spec.

**Descartado**: escribir el código nuevo en español para que case con `app.js`. Contradice el pilar.

**Descartado**: traducir `app.js` dentro de esta tarea. El plan mezclaría una refactorización de código que funciona con una funcionalidad nueva, contra el principio de cambios pequeños. La traducción queda como tarea propia en `MEMORY.md`.

### D8. Utilidades de fecha propias en lugar de extraer las de `app.js`

**Elegido**: `heatmap-logic.js` lleva sus propias utilidades de fecha mínima.

**Descartado**: extraer y reutilizar las de `app.js`. Reutilizar evita divergencias, pero obliga a tocar código que hoy funciona y que ya sufrió un bug de cambio de hora.

**Mitigación**: las pruebas fijan el comportamiento esperado de las utilidades, de modo que si algún día se unifican, se detecta cualquier diferencia.

### D9. Posicionamiento inicial sin JavaScript de scroll

**Elegido**: tras pintar, se asigna la posición de scroll al extremo derecho mediante una asignación descroll, no con `scrollIntoView`, para no provocar salto de página.

**Descartado**: `scrollIntoView`, que además puede focusing el elemento y desplazar la vista verticalmente.

---

## 7. Estrategia de tests

### 7.1 Mecánica

- Fichero `heatmap.test.js`, ejecutado con `node --test` sin instalar nada.
- Sin `package.json`: Node trata los `.js` como CommonJS y la guarda de exportación del punto D1 funciona.
- Node no recogerá `heatmap-logic.js` ni `heatmap-ui.js` como tests: el ejecutor solo busca ficheros con patrón de prueba.

### 7.2 Bloques de pruebas

| Bloque | Qué verifica | RF |
|---|---|---|
| `intensityLevel` | Los seis valores de frontera (0, 29, 30, 59, 60, 119, 120) y un valor alto | RF-2.2, RF-2.3 |
| `isValidSession` | Minutos cero, negativos, no numéricos, 1440, 1441, fecha futura, fecha de hoy | RF-4.1 a RF-4.3 |
| `countExcludedSessions` | Cero, una y varias; array vacío; elemento que no es objeto | RF-4.4, RF-4.5 |
| `sumMinutesByDate` | Varias sesiones del mismo día suman; los descartes no suman | RF-2.1, RF-10.1 |
| `computeWindow` | Lunes de la semana actual; inicio 52 semanas antes; cambio de año y bisiesto | RF-1.2 |
| `buildHeatMap` estructura | 52 columnas, 7 filas, 364 ranuras; filas en orden de lunes a domingo | RF-1.1, RF-1.3 |
| `buildHeatMap` ventana | La última columna queda incompleta; no hay días futuros | RF-1.4 |
| `buildHeatMap` sin datos | Array vacío no rompe nada | RF-1.5 |
| `buildHeatMap` exclusiones | No altera el array de sesiones recibido | RF-11.1 |
| `buildHeatMap` filtro | Rango válido, invertido, con un solo campo, fuera de la ventana, en el futuro | RF-9.3 a RF-9.8 |
| `monthLabelsFor` | Una etiqueta por mes; omite la que no cabe; orden correcto | RF-7.2, RF-7.3 |
| `detailForDate` | Los cuatro estados, incluido el caso "solo descartados" | RF-5.2, RF-5.8, RF-5.9 |
| **Determinismo** | La misma llamada dos veces con la misma fecha da resultados idénticos; cambiar la fecha del sistema no altera el resultado | RF-1.6, RNF-3b |

### 7.3 Pruebas de regresión que se deben escribir sí o sí

Son los casos que la QA detectó como no cubiertos y que han generado errores reales en este proyecto:

| Prueba | Por qué |
|---|---|
| Cambio de hora de verano, último domingo de marzo y de octubre | Las celdas no deben desplazarse de fila ni de columna |
| 29 de febrero en año bisiesto | El día existe y cae en su fila |
| Cambio de año del 31 de diciembre al 1 de enero | Etiquetas de mes correctas |
| Dos sesiones de 20 y 40 minutos el mismo día | Suman 60 y dan nivel 3, no dos celdas sueltas |
| Sesiones duplicadas idénticas | Se cuentan todas |
| Fecha del sistema manipulada | El resultado no cambia, porque la fecha es parámetro |

### 7.4 Verificación en navegador

Los tests cubren la lógica, no el DOM. El resto se comprueba con el MCP de Chrome DevTools, siguiendo el criterio de verificación de `AGENTS.md`:

- Abrir `index.html`, sin servidor.
- Comprobar la vista a 375 px y a 1280 px.
- Recorrer la rejilla con el teclado.
- Confirmar que la consola no muestra errores.
- Probar con 0, 1 y muchas sesiones, y con el filtro activo.
- Comprobar que las sesiones descartadas siguen apareciendo en la lista de sesiones (RF-11.2).

---

## 8. Matriz de cobertura

| RF | Dónde se resuelve |
|---|---|
| RF-1.1 | `heatmap-ui.js` pinta 52×7 con `grid-auto-flow: column`; verificado en `buildHeatMap` estructura |
| RF-1.2 | `computeWindow` |
| RF-1.3 | Filas en orden fijo dentro de `buildHeatMap` |
| RF-1.4 | `buildHeatMap` descarta fechas futuras |
| RF-1.5 | `buildHeatMap` con array vacío |
| RF-1.6 | Todas las funciones reciben `todayIso`; prueba de determinismo |
| RF-2.1 | `sumMinutesByDate` sobre sesiones válidas |
| RF-2.2 | `intensityLevel` |
| RF-2.3 | Umbrales literales en `intensityLevel` |
| RF-3.1 | `intensityLevel(0)` devuelve 0 |
| RF-3.2 | `buildHeatMap` ignora los descartes al calcular el día |
| RF-4.1 | `isValidSession` |
| RF-4.2 | `isValidSession` |
| RF-4.3 | `isValidSession` |
| RF-4.4 | `countExcludedSessions` + aviso en `heatmap-ui.js` |
| RF-4.5 | `countExcludedSessions` devuelve 0 y la interfaz no pinta aviso |
| RF-5.1 | `heatmap-ui.js`, evento de puntero |
| RF-5.2 | `detailForDate` estado `no-session` |
| RF-5.3 | `detailForDate` devuelve el total, no el detalle |
| RF-5.4 | `heatmap-ui.js` no registra eventos de edición |
| RF-5.5 | `heatmap-ui.js`, evento de toque y panel fijo |
| RF-5.6 | Estado inicial vacío del panel |
| RF-5.7 | `heatmap-ui.js` al tocar otra celda |
| RF-5.8 | `detailForDate` estado `invalid-only` |
| RF-5.9 | `detailForDate` estado `partial` |
| RF-6.1 | `index.html` leyenda con cinco entradas |
| RF-6.2 | Leyenda fija, no depende del filtro |
| RF-7.1 | Fila de etiquetas en `index.html` |
| RF-7.2 | `monthLabelsFor` |
| RF-7.3 | `monthLabelsFor` descarta la que no cabe |
| RF-8.1 | CSS de desplazamiento horizontal |
| RF-8.2 | Posicionamiento inicial en `heatmap-ui.js` |
| RF-8.3 | Señales de borde en CSS |
| RF-8.4 | El contenedor no puede pasar de su contenido |
| RF-8.5 | Solo se desplaza el eje horizontal |
| RF-8.6 | `computeWindow` acota la rejilla |
| RF-9.1 | Dos campos de fecha en `index.html` |
| RF-9.2 | `index.html` sin valor inicial |
| RF-9.3 | `parseRange` aplicado en `buildHeatMap` |
| RF-9.4 | `parseRange` devuelve nulo |
| RF-9.5 | `parseRange` devuelve nulo con un campo |
| RF-9.6 | `buildHeatMap` acota el rango a la ventana |
| RF-9.7 | `buildHeatMap` con rango sin días |
| RF-9.8 | La rejilla siempre conserva 7 filas |
| RF-9.9 | `heatmap-ui.js` al retirar el filtro |
| RF-10.1 | `sumMinutesByDate` es la única fuente de minutos |
| RF-10.2 | Notificación desde `renderizar()` en `app.js` |
| RF-10.3 | La rejilla se recalcula entera tras cada cambio |
| RF-11.1 | `buildHeatMap` no muta la entrada |
| RF-11.2 | La lista de sesiones no se toca |
| RF-11.3 | La notificación de `app.js` repinta el mapa |
| RNF-1 | CSS con comprobación a 375 y 1280 |
| RNF-2 | Colores por nivel con tono distinto |
| RNF-2b | Roles ARIA y `tabindex` desplazable |
| RNF-3 | `heatmap-logic.js` sin DOM ni almacenamiento |
| RNF-3b | Todas reciben `todayIso`; prueba de determinismo |
| RNF-4 | `heatmap.test.js` con `node --test` |
| RNF-5 | Sin módulos, sin build |
| RNF-6 | El mapa solo lee; prueba de no mutación |
| RNF-7 | Textos de la interfaz en español |
| RNF-8 | 364 celdas, todas estáticas |

---

## 9. Orden de ejecución

1. `heatmap-logic.js` completo, **antes de tocar la interfaz**.
2. `heatmap.test.js` hasta que todos los bloques de la sección 7.2 y 7.3 estén en verde. Si hay alguna en rojo, no se continúa (constitución 4).
3. `index.html` y `styles.css` con la sección del mapa.
4. `heatmap-ui.js`.
5. Enganche de una línea en `app.js`.
6. Verificación en navegador según la sección 7.4.
7. `AGENTS.md` y `MEMORY.md`.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Reutilizar fechas de `app.js` crearía divergencia con la lógica ya corregida | D8: utilidades propias y pruebas que fijan el comportamiento |
| El estado del panel y del tooltip duplicaría texto | Ambos leen el mismo `estado` que devuelve `detailForDate` |
| 364 celdas pueden lastrar la página | RNF-8 se verifica en navegador a 375 px; si falla, se revisa antes de dar por buena la spec |
| La rejilla con filtro de un solo día podría romperse | RF-9.8 exige conservar las 7 filas; hay prueba |
| El panel táctil y el detalle de puntero pueden contradecirse | Ambos parten del mismo estado, no delcolor |

---

## 11. Fuera de este plan

No se implementa nada de la sección 7 de la spec (fuera de alcance). Tampoco se corrigen los hallazgos de QA que siguen abiertos, porque no afectan a esta funcionalidad: son detalles de redacción de la spec, no de comportamiento.
