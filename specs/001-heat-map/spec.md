# Spec 001 — Mapa de calor de estudio

Estado: borrador para revisión
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
> `Cuando` = evento · `Mientras` = estado · `Siempre` = invariante · `Si` = comportamento no deseado · `Dónde` = funcionalidad opcional.

### RF-1 — Representación del periodo anual

- **RF-1.1** Cuando el usuario visualiza el mapa de calor, el sistema muestra una rejilla de **52 columnas (semanas) por 7 filas (días de la semana)** que cubre los últimos doce meses hasta hoy.
- **RF-1.2** Siempre cada columna representa una semana completa y cada fila un día de la semana, de modo que dos celdas en la misma fila caigan en el mismo día de la semana.
- **RF-1.3** Cuando la rejilla incluye días anteriores a la primera sesión registrada, el sistema los representa igual que a un día sin estudio.
- **RF-1.4** Si una semana está parcialmente fuera del periodo de doce meses, el sistema la muestra solo en la parte que corresponde al periodo.

### RF-2 — Intensidad por minutos acumulados del día

- **RF-2.1** Mientras un día tenga al menos una sesión registrada, el sistema calcula el total de minutos de ese día sumando todas sus sesiones.
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

- **RF-3.1** Cuando un día no tiene ninguna sesión con minutos válidos, el sistema lo representa como celda vacía, sin color de intensidad.
- **RF-3.2** Si un día tiene sesiones pero todas suman cero minutos o menos, el sistema lo trata como día sin estudio.

### RF-4 — Exclusión de datos no válidos y fechas futuras

- **RF-4.1** Si una sesión tiene minutos negativos, no numéricos o iguales a cero, el sistema la excluye del cálculo de la intensidad de su día.
- **RF-4.2** Si una sesión tiene fecha posterior al día de hoy, el sistema la excluye del mapa de calor.
- **RF-4.3** Si una sesión tiene minutos superiores a 1440 (más de un día), el sistema la excluye del cálculo, por considerar que es un dato corrupto.
- **RF-4.4** Si existe al menos una sesión excluida por cualquiera de los motivos anteriores, el sistema muestra un aviso no bloqueante que indica cuántas se han ignorado.
- **RF-4.5** Si no existe ninguna sesión excluida, el sistema no muestra aviso alguno.

### RF-5 — Detalle bajo demanda

- **RF-5.1** Cuando el usuario pasa el puntero sobre una celda, el sistema muestra su fecha y el total de minutos estudiados ese día.
- **RF-5.2** Si el día no tiene sesiones válidas, el sistema indica explícitamente que no se estudió ese día, en lugar de mostrar un total de cero sin contexto.
- **RF-5.3** Si el día tiene varias sesiones, el sistema muestra el total de minutos del conjunto, sin desglosar cada sesión.
- **RF-5.4** Mientras la rejilla se muestra, el mapa de calor no permite crear, editar ni eliminar sesiones.
- **RF-5.5** Donde el dispositivo no tenga puntero, el usuario obtiene el mismo detalle **tocando la celda y consultando un panel fijo situado bajo la rejilla**, en lugar de un aviso flotante.
- **RF-5.6** Si no hay ningún día seleccionado en el panel, el sistema indica que se toque un día para ver su detalle.
- **RF-5.7** Si el usuario toca un día distinto, el panel pasa a mostrar ese día.

### RF-6 — Leyenda

- **RF-6.1** Siempre que el mapa de calor sea visible, el sistema muestra una leyenda que enumera todos los tramos de intensidad.
- **RF-6.2** Si el tramo "sin estudio" está definido, la leyenda incluye una entrada que lo representa.

### RF-7 — Etiquetas de mes

- **RF-7.1** Cuando el mapa de calor se muestra, el sistema etiqueta los meses que atraviese la rejilla para que el usuario sepa en qué mes está mirando.

### RF-8 — Desplazamiento entre periodos

- **RF-8.1** Mientras el mapa de calor sea visible, el sistema permite desplazar la rejilla lateralmente para ver periodos anteriores.
- **RF-8.2** Al mostrar el mapa por primera vez, el sistema deja la rejilla situada en el periodo **más reciente**, de modo que el usuario vea primero sus días actuales y no los más antiguos.
- **RF-8.3** Donde la rejilla no ocupe todo el ancho disponible, el sistema muestra una señal visual en el borde por el que queda contenido por explorar, de modo que el usuario sepa que existe más periodo.
- **RF-8.4** Si se alcanza el primer día con sesiones registradas, el sistema impide desplazarse más atrás.
- **RF-8.5** El desplazamiento lateral en dispositivos con pantalla táctil no debe impedir el desplazamiento vertical de la página.

### RF-9 — Filtro por rango de fechas

- **RF-9.1** El filtro se introduce mediante **dos campos de fecha**, uno de inicio y otro de fin.
- **RF-9.2** Donde el filtro por rango de fechas esté activo, el sistema limita la rejilla a los días comprendidos entre la fecha inicial y la final indicadas por el usuario.
- **RF-9.3** Si el rango indicado es inválido (fecha final anterior a la inicial), el sistema lo rechaza e informa al usuario sin alterar la vista.
- **RF-9.4** Si el rango no cubre ningún día con sesiones, la rejilla aparece vacía sin mostrar un error.
- **RF-9.5** Cuando el usuario retira el filtro, el sistema vuelve a mostrar el año completo y restablece el desplazamiento al periodo más reciente.

### RF-10 — Coherencia con el resto de la aplicación

- **RF-10.1** Mientras el mapa de calor sea visible, el total de minutos que representa un día concreto debe coincidir con la suma que el resto de la aplicación calcula para ese mismo día.
- **RF-10.2** Si una sesión se añade, edita o elimina, el mapa de calor refleja el cambio sin que el usuario tenga que recargarla.
- **RF-10.3** Si una sesión se edita cambiando su fecha, el sistema la traslada de la columna correspondiente a la fecha original a la de la nueva fecha.

---

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| **RNF-1** | El mapa de calor debe ser **legible y utilizable en pantalla de móvil**, requisito que se evalúa con una anchura de 375 píxeles. |
| **RNF-2** | La intensities debe distinguirse **sin depender del color únicamente**: cada nivel ha de ser identificable también por su tono, para no excluir a personas con daltonismo. |
| **RNF-3** | El cálculo de la intensidad debe ser una **función pura sin efectos sobre estado**, apta para verificarse de forma aislada. |
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

1. Todos los **RF-1 a RF-10** cumplen sus criterios de aceptación.
2. Las **pruebas de la lógica de intensidad** están escritas, pasan y cubren al menos los casos de los tramos, los días sin estudio, las fechas futuras y los minutos inválidos.
3. No existen **pruebas en rojo**.
4. El mapa se ha **verificado en navegador real** tanto en la vista de escritorio como en una anchura de 375 píxeles.
5. Se ha comprobado que el **mapa nunca deja de funcionar** con 0, 1 y muchas sesiones registradas.
6. La **consola del navegador no muestra errores**.
7. Se ha comprobado que **las sesiones del usuario no se han visto alteradas** por la incorporación del mapa.
8. Se ha verificado el comportamiento con la **opción de movimiento reducido activada** en el sistema.
9. La documentación del proyecto refleja la nueva funcionalidad.

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
| Navegación | Desplazamiento lateral, abriendo en el periodo más reciente |
| Datos anómalos | Se descartan las futuras y las de minutos no válidos |