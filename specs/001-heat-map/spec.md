# Spec 001 — Mapa de calor de estudio

Estado: revisada por QA. Sin contradicciones conocidas. Decisiones pendientes de confirmar en la sección 9.
Constitution: `docs/constitution.md` (debe cumplirse en su totalidad)

---

## 1. Contexto y objetivo

El Diario de Estudio permite registrar sesiones y conocer la racha de días seguidos, la mejor racha, los minutos de la semana en curso y los días del mes. Todas esas cifras son **agregados**: responden a "¿cuánto llevo?", pero no a **"¿cómo distribuyo mi esfuerzo?"**.

Hoy no hay forma de ver los días estudiados de golpe. Un usuario que estudia cinco días y descansa dos no percibe el patrón: solo ve un número que sube o baja. El descanso se hace invisible.

El objetivo es añadir una **rejilla de un año** donde cada día sea una celda coloreada según los minutos estudiados ese día, al estilo del gráfico de contribuciones de GitHub. Sirve para dos cosas:

- **Visualizar la constancia**: ver la forma del año de un vistazo y detectar semanas flojas o rachas de estudio que las cifras agregadas esconden.
- **Favorecer la motivación**: ver una fila larga de celdas encendidas es más impactante que un número suelto.

El mapa es **informativo**: sirve para mirar, no para modificar datos.

---

## 2. Usuarios

| Usuario | Necesidad |
|---|---|
| **Usuario principal** — persona que estudia a diario y usa el diario como vínculo de hábito | Ver si mantiene la constancia y comparar semanas entre sí |
| **Usuario secundario** — persona que vuelve tras una pausa y quiere entender su evolución reciente | Ver de un vistazo qué días activó en las últimas semanas |

No hay otros perfiles previstos. No se contempla el uso compartido ni por varias personas sobre los mismos datos.

---

## 3. Historias de usuario

**HU-1 — Ver el año completo de un vistazo**
Como usuario que estudia a diario, quiero ver mis últimos doce meses en una rejilla para entender mi constancia y detectar los periodos en los que estudié menos.

**HU-2 — Distinguir un día tranquilo de uno intenso**
Como usuario, quiero que la intensidad de color de cada día dependa de los minutos que estudié, para distinguir un día de 20 minutos de uno de tres horas.

**HU-3 — Saber qué día es cada celda**
Como usuario, quiero ver la fecha y los minutos de un día al pasar el ratón por encima, para no tener que contar semanas hasta encontrar un día concreto.

**HU-4 — Entender los colores sin ayuda externa**
Como usuario, quiero una leyenda que explique qué significa cada color, para interpretar el mapa sin que nadie me lo explique.

**HU-5 — Localizar un periodo concreto**
Como usuario, quiero desplazarme por el año y filtrar por rango de fechas, para analizar un trimestre o un mes concreto en lugar del año entero.

---

## 4. Requisitos funcionales

> Criterios de aceptación en notación EARS.
> `Cuando` = evento · `Mientras` = estado · `Siempre` = invariante · `Si` = comportamiento no deseado · `Dónde` = funcionalidad opcional.

### RF-1 — Representación del periodo anual

- **RF-1.1** Cuando el usuario visualiza el mapa de calor, el sistema muestra una rejilla de **52 columnas por 7 filas**. Cada columna es una semana de calendario (de lunes a domingo) y cada fila es un día de la semana, ordenadas de lunes arriba a domingo abajo.
- **RF-1.2** Por defecto, la rejilla muestra las 52 semanas más recientes, hasta la que contiene hoy.
- **RF-1.3** Siempre dos celdas de la misma fila caen en el mismo día de la semana, de modo que el usuario pueda comparar el mismo día entre semanas.
- **RF-1.4** Si una celda corresponde a un día posterior a hoy, el sistema no la representa. La última columna queda por tanto incompleta.
- **RF-1.5** Cuando la rejilla incluye días anteriores a la primera sesión registrada, el sistema los representa igual que a un día sin estudio.
- **RF-1.6** Siempre el cálculo de la rejilla **recibe el día de hoy como parámetro** y no lo obtiene del reloj del sistema, de modo que el resultado dependa únicamente de los datos de estudio y de esa fecha.

### RF-2 — Intensidad por minutos acumulados del día

- **RF-2.1** Mientras un día tenga al menos una sesión **válida**, el sistema calcula el total de minutos de ese día sumando todas sus sesiones válidas.

**Sesión válida**: una cuya fecha no es posterior a hoy y cuyos minutos son un número entero mayor que 0 y menor o igual que 1440. Cualquier sesión que no cumpla esto queda **excluida** (RF-4).
- **RF-2.2** Donde el total del día se sitúe en un tramo de intensidad, el sistema colorea la celda con el color de ese tramo.
- **RF-2.3** Siempre los umbrales que definen los tramos son **absolutos y fijos**: el mismo número de minutos produce el mismo color con independencia de qué otros días tengan el usuario registrados.

**Tramos de intensidad**

| Nivel | Minutos del día | Lectura |
|---|---|---|
| Sin estudio | 0 | Celda vacía |
| 1 | 1 – 29 | Día breve |
| 2 | 30 – 59 | Día normal |
| 3 | 60 – 119 | Buen día |
| 4 | 120 o más | Día intenso |

Estos cuatro tramos cubren las duraciones habituales de una sesión (25, 45 y 90 minutos) y reservan el nivel máximo para los días de dos horas o más, de modo que el color más alto signifique siempre un esfuerzo excepcional.

### RF-3 — Días sin estudio válido

- **RF-3.1** Cuando un día no tiene ninguna sesión registrada, el sistema lo representa como celda vacía, sin color de intensidad.
- **RF-3.2** Si tras aplicar las exclusiones de RF-4 un día se queda sin ninguna sesión, el sistema lo representa también como celda vacía.

### RF-4 — Exclusión de datos no válidos y fechas futuras

- **RF-4.1** Si una sesión tiene minutos negativos, no numéricos o iguales a cero, el sistema la excluye del cálculo de la intensidad de su día.
- **RF-4.2** Si una sesión tiene fecha posterior al día de hoy, el sistema la excluye del mapa de calor.
- **RF-4.3** Si una sesión tiene minutos superiores a 1440 (más de un día), el sistema la excluye del cálculo, por considerar que es un dato corrupto.
- **RF-4.4** Si existe al menos una sesión excluida por cualquiera de los motivos anteriores, el sistema muestra un aviso no bloqueante que indica cuántas se han ignorado.
- **RF-4.5** Si no existe ninguna sesión excluida, el sistema no muestra aviso alguno.

### RF-5 — Detalle bajo demanda

- **RF-5.1** Cuando el usuario pasa el puntero sobre una celda, el sistema muestra su fecha y el total de minutos estudiados ese día.
- **RF-5.2** Si el día no tiene **ninguna sesión registrada**, el sistema indica explícitamente que no se estudió ese día.
- **RF-5.3** Si el día tiene varias sesiones, el sistema muestra el total de minutos del conjunto, sin desglosar cada sesión.
- **RF-5.4** Mientras la rejilla se muestra, el mapa de calor no permite crear, editar ni eliminar sesiones.
- **RF-5.5** Donde el dispositivo **no pueda señalar** con un puntero (pantalla táctil sin ratón), el usuario obtiene el mismo detalle **tocando la celda y consultando un panel fijo situado bajo la rejilla**, en lugar de un aviso flotante. En dispositivos que ofrecen ambas formas, funcionan las dos: puntero muestra el detalle y el toque actualiza el panel.
- **RF-5.6** El panel arranca vacío e indica que se toque un día para ver su detalle.
- **RF-5.7** Si el usuario toca un día distinto, el panel pasa a mostrar ese día.
- **RF-5.8** Si el día **tiene sesiones pero todas han sido excluidas** por minutos no válidos o por ser posteriores a hoy, el sistema indica que el registro de ese día se ha descartado por datos no válidos. En este caso **nunca afirma que no se estudió ese día**, porque no es cierto: el usuario pudo estudiar y el registro estar corrupto.
- **RF-5.9** Si el día tiene alguna sesión válida junto a otras excluidas, el sistema muestra el total de las válidas y señala que se ha descartado algún registro de ese día.

### RF-6 — Leyenda

- **RF-6.1** Siempre que el mapa de calor sea visible, el sistema muestra una leyenda que enumera **los cinco tramos de intensidad**: sin estudio, 1, 2, 3 y 4.
- **RF-6.2** La leyenda mantiene los mismos cinco tramos tanto si la rejilla está filtrada como si no.

### RF-7 — Etiquetas de mes

- **RF-7.1** Cuando el mapa de calor se muestra, el sistema etiqueta los meses que atraviese la rejilla para que el usuario sepa en qué mes está mirando.
- **RF-7.2** Si un mes ocupa varias columnas, se etiqueta **una sola vez**, sobre la columna donde aparece por primera vez. No se repite la etiqueta en cada columna.
- **RF-7.3** Si dos etiquetas de mes no caben una junto a la otra, el sistema **omite la que no quepa** antes que solaparlas, y mantiene el orden de izquierda a derecha.

### RF-8 — Desplazamiento dentro del periodo

> La rejilla siempre muestra las mismas 52 semanas (RF-1.2). Desplazarse **no cambia el periodo**: sirve para recorrer las columnas que no caben en la pantalla, algo que ocurre siempre en móvil.

- **RF-8.1** Si las 52 columnas no caben en el ancho disponible, el sistema permite desplazar la rejilla lateralmente para recorrerlas todas.
- **RF-8.2** Al mostrar el mapa por primera vez, el sistema deja la rejilla situada en las **columnas más recientes**, de modo que el usuario vea primero sus días actuales.
- **RF-8.3** Mientras quede contenido por explorar hacia alguno de los lados, el sistema muestra una señal visual en el borde correspondiente, de modo que el usuario sepa que puede desplazarse más.
- **RF-8.4** El desplazamiento no permite ir más allá de la primera ni de la última columna de la rejilla.
- **RF-8.5** El desplazamiento lateral en dispositivos con pantalla táctil no debe impedir el desplazamiento vertical de la página.
- **RF-8.6** El sistema nunca muestra datos anteriores a las 52 semanas de la ventana, ni siquiera al desplazarse hasta el extremo.

### RF-9 — Filtro por rango de fechas

- **RF-9.1** El filtro se introduce mediante **dos campos de fecha**, uno de inicio y otro de fin.
- **RF-9.2** Los dos campos arrancan **vacíos**, sin filtro aplicado, y muestran la rejilla completa.
- **RF-9.3** Donde el filtro por rango de fechas esté activo, el sistema limita la rejilla a los días comprendidos entre la fecha inicial y la final indicadas por el usuario.
- **RF-9.4** Si el rango indicado es inválido (fecha final anterior a la inicial), el sistema lo rechaza e informa al usuario sin alterar la vista.
- **RF-9.5** Si solo uno de los dos campos está rellenado, el sistema **no aplica filtro** y mantiene la rejilla completa, sin mostrar error.
- **RF-9.6** El filtro nunca muestra días **fuera de la ventana de 52 semanas**. Si el rango incluye días anteriores, se representan únicamente los que caen dentro de la ventana.
- **RF-9.7** Si tras filtrar el rango no queda ningún día dentro de la ventana, la rejilla aparece vacía sin mostrar un error.
- **RF-9.8** La rejilla conserva su estructura de 7 filas aunque el rango cubra un solo día; las filas sin días que mostrar quedan vacías.
- **RF-9.9** Cuando el usuario retira el filtro, el sistema vuelve a mostrar el año completo y restablece el desplazamiento a las columnas más recientes.

### RF-10 — Coherencia con el resto de la aplicación

- **RF-10.1** El total de minutos que el mapa representa para un día **coincide con la suma de las sesiones válidas de ese mismo día**. Ninguna sesión válida puede aparecer en el mapa y a la vez quedar fuera de los totales de la aplicación, ni al contrario.
- **RF-10.2** Si una sesión se añade, edita o elimina, el mapa de calor refleja el cambio sin que el usuario tenga que recargarla.
- **RF-10.3** Si una sesión se edita cambiando su fecha, el sistema la retira del día original y la representa en el día nuevo, en la posición que le corresponde dentro de la rejilla.

### RF-11 — Las exclusiones no tocan los datos

- **RF-11.1** Las sesiones excluidas por RF-4 **solo se omiten al representar el mapa**. El sistema nunca las borra, las modifica ni las cuenta como eliminadas.
- **RF-11.2** Las sesiones excluidas **siguen apareciendo en la lista de sesiones** de la aplicación, donde el usuario puede verlas y corregirlas.
- **RF-11.3** Mientras el mapa de calor sea visible, corregir o eliminar una sesión excluida hace que deje de estar excluida y pase a representarse.

---

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| **RNF-1** | El mapa de calor debe ser **legible y utilizable en pantalla de móvil**, requisito que se evalúa con una anchura de 375 píxeles. La comprobación se repite a **375 px** y a **1280 px**, y no hay anchuras intermedias obligatorias. |
| **RNF-2** | La intensidad debe distinguirse **sin depender del color únicamente**: cada nivel ha de ser identificable también por su tono, para no excluir a personas con daltonismo. |
| **RNF-2b** | El mapa es operable **solo con teclado** y cada celda expone su fecha y su total a lectores de pantalla. Una rejilla de 364 celdas no puede depender del puntero. |
| **RNF-3** | El cálculo de la intensidad debe ser una **función pura sin efectos sobre estado**, apta para verificarse de forma aislada. |
| **RNF-3b** | Conforme a la constitución, todo cálculo recibe **"hoy" como parámetro** y **no lee el reloj del sistema**. Dos ejecuciones con los mismos datos y la misma fecha deben dar siempre el mismo resultado, se ejecuten cuando se ejecuten. |
| **RNF-4** | La lógica de intensidades debe quedar **cubierta por pruebas automáticas** que se ejecuten sin instalar nada adicional. |
| **RNF-5** | La aplicación debe seguir **funcionando abriendo la página directamente**, sin servidor ni paso de compilación. |
| **RNF-6** | Ninguna funcionalidad nueva debe **alterar los datos ya guardados** por el usuario. |
| **RNF-7** | Los textos visibles del mapa de calor están en **español**. |
| **RNF-8** | La rejilla de 52 semanas debe representarse **sin degradar la respuesta de la página** en un móvil de gama media. |

---

## 6. Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Usuario sin ninguna sesión | La rejilla aparece completamente vacía; no hay errores ni celdas de color. |
| Usuario con un único día de estudio | Ese día se ilumina y el resto queda vacío. |
| Varias sesiones el mismo día | Se suman para determinar un único color. |
| Sesión de 1440 minutos exactos | Se considera válida (no supera el límite). |
| Sesión de 1441 minutos | Se excluye por dato corrupto. |
| Día actual con estudios parciales | Cuenta con normalidad; no hay que esperar a que termine el día. |
| Cambio de mes o de año dentro de la rejilla | Las etiquetas de mes sitúan correctamente cada columna. |
| Semana que empieza antes del inicio del periodo | La celda del día fuera de rango no se representa. |
| Rango de filtro de un solo día | La rejilla muestra únicamente ese día. |
| Rango de filtro totalmente fuera de los datos | La rejilla aparece vacía, sin error. |
| Navegación más allá del primer día con datos | El desplazamiento se detiene, sin celdas corruptas. |
| Fechas futuras ya registradas por el usuario | No aparecen en el mapa. |
| Cambio de hora o de zona horaria del dispositivo | El mapa se recalcula con las fechas locales, sin desplazar días. |
| Filtro aplicado y luego datos nuevos registrados | La vista filtrada refleja los datos nuevos sin romperse. |
| Día con exactamente 29, 30, 59, 60, 119 o 120 minutos | Cada valor cae en el tramo que le corresponde por definición, sin casos intermedios. |
| Dos sesiones válidas que suman justo el cambio de tramo (p. ej. 20 + 40) | Se suman antes de decidir el color: 60 minutos es nivel 3. |
| Año bisiesto con 29 de febrero dentro de la ventana | El día existe y se representa en su fila correcta. |
| Cambio de hora de verano (último domingo de marzo y de octubre) | Las celdas no se desplazan de fila ni de columna. |
| Filtro cuya fecha de inicio es anterior a la ventana de 52 semanas | La rejilla se limita a la ventana disponible, sin celdas inventadas. |
| Filtro íntegramente en el futuro | La rejilla aparece vacía, sin error. |
| Filtro con solo uno de los dos campos rellenado | No se aplica el filtro o se trata como rango abierto, de forma coherente y sin error. |
| Dos o más sesiones idénticas en fecha, tema y minutos | Se cuentan todas; el usuario puede tener registros duplicados y no se pierden. |
| Almacenamiento con array corrupto o elementos que no son objetos | El mapa se dibuja con lo que sea legible, sin romperse ni lanzar errores. |
| Fecha del sistema desfasada respecto a la real | "Hoy" es el parámetro recibido; el reloj del sistema no interviene. |

---

## 7. Fuera de alcance

Queda explícitamente **excluido** de esta versión:

- Crear, editar o eliminar sesiones desde el mapa de calor (queda solo informativo).
- Períodos de más de doce meses.
- Exportar o imprimir el mapa.
- Estadísticas nuevas derivadas del mapa (totales por mes, media por semana, etc.).
- Comparar dos años o ver la evolución en porcentaje de mejora.
- Personalizar los umbrales de intensidad o el número de niveles de color.
- Vista en otros formatos (calendario mensual, gráfico de barras, lista).
- Cualquier dato que no provenga de las sesiones ya registradas.

---

## 8. Criterios de finalización

La funcionalidad se considera terminada cuando:

1. Todos los **RF-1 a RF-11** cumplen sus criterios de aceptación.
2. Las **pruebas de la lógica de intensidad** están escritas, pasan y cubren al menos los casos de los tramos, los días sin estudio, las fechas futuras y los minutos inválidos.
3. Las pruebas **pasan la fecha de hoy explícitamente como parámetro** y ninguna depende del reloj del sistema: ejecutarlas con una fecha fija produce el mismo resultado hoy y dentro de un año.
4. No existen **pruebas en rojo**.
5. El mapa se ha **verificado en navegador real** tanto a 1280 píxeles como a 375 píxeles.
6. Se ha comprobado que el **mapa nunca deja de funcionar** con 0, 1 y muchas sesiones registradas.
7. La **consola del navegador no muestra errores**.
8. Se ha comprobado que **las sesiones del usuario no se han visto alteradas** por la incorporación del mapa, incluidas las que el mapa descarta por ser no válidas, que siguen apareciendo en la lista de sesiones.
9. El mapa se puede **recorrer y consultar solo con teclado**, y cada celda anuncia su fecha y sus minutos a un lector de pantalla.
10. Si el mapa introduce algún movimiento o transición, se ha verificado su comportamiento con la **opción de movimiento reducido** activada en el sistema.
11. La documentación del proyecto refleja la nueva funcionalidad.

---

## 9. Decisiones pendientes de revisión

> No son **[NECESITA ACLARACIÓN]**: el spec ya es implementable con ellas.
> Se advierte que las tomó el asistente por iniciativa propia y conviene que el usuario las confirme o las cambie.

**DECISIÓN PROPIA — Ubicación del mapa**
El mapa se coloca entre la tarjeta de racha y el formulario. El orden queda: **racha → mapa → registrar → lista de sesiones**, es decir, primero la vista de conjunto, después la acción y por último el detalle. Motivo: el mapa es un resumen del año y pertenece conceptualmente junto a las demás cifras; el formulario baja a una posición intermedia pero sigue siendo visible sin desplazamiento largo.

**DECISIÓN PROPIA — Aviso ante sesiones inválidas**
Cuando existan sesiones con minutos no válidos o fechas futuras, el sistema muestra un **aviso discreto y no bloqueante** bajo el mapa indicando cuántas se han ignorado. Motivo: excluirlas en silencio puede esconder un dato corrupto que el usuario querría corregir, pero un aviso no debe interrumpir ni ensuciar la rejilla. **El aviso nunca se marca dentro de la celda**, porque contaminaría la escala de color. Si no hay ninguna sesión inválida, no se muestra aviso alguno.

---

## 10. Decisiones ya resueltas

| Tema | Decisión |
|---|---|
| Periodo | 52 semanas (un año) |
| Escala de intensidad | Umbrales absolutos y fijos |
| Tramos concretos | 1–29 / 30–59 / 60–119 / 120+ |
| Interacción | Solo informativa, sin edición desde el mapa |
| Detalle en táctil | Panel fijo bajo la rejilla al tocar |
| Filtro por rango | Dos campos de fecha (desde / hasta) |
| Navegación | Desplazamiento lateral **dentro** de las 52 semanas, abriendo en las columnas más recientes |
| Datos anómalos | Se descartan las futuras y las de minutos no válidos, **solo al representar** |
| Estructura | 52 columnas = semanas calendario (lunes a domingo); 7 filas = días de la semana |
| Días futuros | No se representan; la última columna queda incompleta |
| Filtro con un solo campo | No se aplica filtro, sin error |
| Accesibilidad | Operable con teclado y celdas legibles por lector de pantalla |
