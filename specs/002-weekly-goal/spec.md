# Spec 002 — Objetivo semanal de estudio

Estado: **implementada** (v1.9.0). Las 10 tareas de `tasks.md` están completas y los 142 tests pasan. La parte dividida sigue viva en la spec 003.
Constitution: `docs/constitution.md` (debe cumplirse en su totalidad)
Código de referencia: la spec 001 (mapa de calor) **ya está implementada y en producción** (v1.8.0). Esta spec se apoya en ella y **no la modifica ni la deroga**.
Alcance: esta spec toca `app.js` en **dos líneas** y en nada más: quitar la llamada a la estadística que desaparece (RF-8.2) y añadir el aviso al objetivo (RF-3.9). El bloque del objetivo tiene **arranque propio** (RF-10.7), así que se pinta aunque el resto de la aplicación no llegue a pintarse. La reparación del almacenamiento heredado, la lista de sesiones que no se rompe y la verificación pesada viven en `specs/003-resilient-session-list/spec.md`.

> Esta spec describe **qué** se hace y **por qué**. El stack, la arquitectura y los nombres de los ficheros van en el plan.
> Todas las decisiones están tomadas y confirmadas: las de producto están en la sección 11. **No queda ninguna decisión pendiente de revisión.** La sección 9 se conserva por estructura y recoge solo las características conocidas del código ya entregado que esta spec **no va a tocar**.
> **Cambios de esta reapertura**: se quitaron el RF-11 y los cuatro textos sustitutos de la lista, y los criterios que dependían del arreglo del almacenamiento, porque esos contenidos pasaron a la spec 003. La excepción a la constitución 7 se trasladó **íntegra** a esa spec. En esta segunda reapertura se añadió el arranque propio del objetivo (RF-10.7 a RF-10.9) y su criterio de verificación (criterio 22).

---

## 1. Contexto y objetivo

Hoy la aplicación responde a **"¿cuánto llevo esta semana?"** con una cifra suelta: los minutos estudiados desde el lunes. Pero un número sin meta no dice nada sobre si es suficiente. Quien estudia 90 minutos se siente igual de conforme que quien estudia 5 minutos, porque la pantalla no pone ninguna referencia contra la que compararse.

El objetivo es que la persona pueda **fijar cuántos minutos quiere estudiar cada semana** y ver, en cualquier momento, **cuánto lleva de esa meta**. La funcionalidad sirve para tres cosas:

- **Dar una referencia**: el objetivo convierte una cifra en una meta con la que comparar, no en un dato aislado.
- **Favorecer la motivación**: ver lo que falta para cumplir, o ver que ya se ha cumplido, es más accionable que ver un total.
- **Cerrar el ciclo al cambiar de semana**: al empezar una semana nueva el punto de partida vuelve a cero, y con él la posibilidad de cumplir una meta nueva.

La funcionalidad **compara lo ya registrado con lo que la persona se ha propuesto**. No crea datos de estudio nuevos ni modifica sesiones. Sí añade trabajo de cálculo que hoy no existe: la comparación con un objetivo y el descarte de registros que no permiten afirmar nada.

**Límite de lo que la pantalla afirma**: el diario solo conoce lo que la persona ha registrado. El progreso habla siempre de **minutos registrados**, nunca de minutos estudiados.

---

## 2. Usuarios

| Usuario | Necesidad |
|---|---|
| **Usuario principal** — persona que estudia a diario y usa el diario como vínculo de hábito | Fijarse una meta semanal y ver de un vistazo cuánto le falta para cumplirla |
| **Usuario secundario** — persona que vuelve tras una pausa y vuelve a organizarse | Tener una meta concreta que le ordene la reincorporación, en lugar de cifras sueltas |

No hay otros perfiles previstos. No se contempla el uso compartido ni por varias personas sobre los mismos datos.

---

## 3. Historias de usuario

**HU-1 — Fijar mi meta de la semana**
Como usuario, quiero indicar cuántos minutos quiero estudiar cada semana, para tener una referencia clara de lo que espero de mí.

**HU-2 — Saber cuánto me falta por registrar**
Como usuario, quiero ver cuántos minutos me faltan para cumplir el objetivo, para saber si voy por buen camino y mantener el ritmo el resto de la semana.

**HU-3 — Saber si ya lo he cumplido**
Como usuario, quiero que la aplicación me diga claramente que he cumplido el objetivo, para sentir la recompensa y cerrar la semana con seguridad.

**HU-4 — Empezar de cero cada semana**
Como usuario, quiero que al cambiar de semana la cuenta vuelva a empezar y la meta siga vigente, para que cada semana sea una ocasión nueva de cumplirla.

**HU-5 — Corregir mi meta cuando cambien mis planes**
Como usuario, quiero cambiar el objetivo en cualquier momento, aunque la semana ya haya empezado, para que la referencia siga siendo realista y no una meta inalcanzable.

---

## 4. Definiciones

> Solo se definen los términos que pueden interpretarse de más de una forma.

- **Semana**: periodo de siete días, **de lunes a domingo**, en la hora local de quien usa la aplicación.
- **Semana en curso**: la única semana que la aplicación considera. No hay otras semanas consultables.
- **Sesión válida**: una que permite afirmar algo sobre el estudio de ese día. Una sesión **no es válida** si no tiene la forma de datos esperada, si su fecha está ausente o no se puede interpretar, si sus minutos no son un número entero, si sus minutos son menores o iguales que cero, si sus minutos superan 1440 o si su fecha es posterior al día de hoy. Es el mismo criterio que ya aplica el mapa de calor.
- **Minutos registrados de la semana**: suma de los minutos de las sesiones **válidas** cuya fecha va desde el lunes de la semana en curso hasta hoy, ambas incluidas. Las sesiones de días posteriores a hoy no cuentan.
- **Objetivo semanal**: número de minutos que la persona se propone estudiar durante la semana en curso.
- **Minutos por registrar**: diferencia entre el objetivo semanal y los minutos registrados de la semana, mientras la meta no esté cumplida.
- **Estado en curso**: los minutos registrados son menores que el objetivo semanal.
- **Estado cumplido**: los minutos registrados alcanzan o superan el objetivo semanal.
- **Valor por defecto**: el objetivo de 30 minutos que se usa mientras la persona no haya confirmado ninguno.
- **Punto de lectura del reloj**: el único lugar **dentro de esta funcionalidad** que obtiene el día de hoy del reloj del sistema. La aplicación ya tiene otras lecturas de reloj en el código entregado y esta spec **no las unifica**. No es una función de cálculo: su salida se entrega como parámetro a los cálculos del objetivo.

---

## 5. Requisitos funcionales

> Criterios de aceptación en notación EARS.
> `Cuando` = evento · `Mientras` = estado · `Siempre` = invariante · `Si` = comportamiento no deseado · `Dónde` = funcionalidad opcional.

### RF-1 — Minutos registrados de la semana

- **RF-1.1** Cuando se consultan los minutos registrados de la semana, el sistema suma los minutos de las sesiones **válidas** cuya fecha está comprendida entre el lunes de la semana en curso y hoy, ambas fechas incluidas.
- **RF-1.2** Siempre la semana en curso va **de lunes a domingo**, con esos límites calculados en la hora local de quien usa la aplicación.
- **RF-1.3** Siempre el cálculo de los minutos registrados **recibe el día de hoy como parámetro** y no lo obtiene del reloj del sistema, de modo que el resultado dependa únicamente de las sesiones guardadas y de esa fecha.
- **RF-1.4** Si una sesión tiene fecha posterior a hoy, el sistema **no la suma**, aunque su fecha esté dentro de la semana en curso.
- **RF-1.5** Si una sesión tiene fecha del lunes de la semana en curso, el sistema **la suma**: el lunes cuenta.
- **RF-1.6** Si hoy es domingo, los minutos registrados incluyen los siete días de la semana, porque la semana en curso ha transcurrido entera.
- **RF-1.7** Si no hay ninguna sesión válida en la semana en curso, los minutos registrados son **0**.

### RF-2 — El objetivo semanal

- **RF-2.1** Donde exista la funcionalidad, la persona puede pedir la edición del objetivo, escribir un valor en minutos y confirmarlo con el botón de guardar.
- **RF-2.2** Siempre hay **un único objetivo vigente**: no existe uno distinto para cada semana.
- **RF-2.3** Si no hay objetivo guardado, o el guardado está vacío, ilegible o corrupto, el sistema usa **30 minutos** como valor por defecto.
- **RF-2.4** Si el objetivo indicado **no es un entero escrito en cifras**, el sistema lo rechaza, **no guarda nada** y muestra el mensaje de objetivo no válido (RF-9.1).
- **RF-2.5** Si el objetivo indicado es un entero escrito en cifras pero queda **fuera del intervalo de 1 a 10080**, el sistema lo rechaza, **no guarda nada** y muestra el mismo mensaje de objetivo no válido.
- **RF-2.6** Si el campo de objetivo se confirma **vacío**, el sistema lo rechaza, **mantiene el objetivo vigente** y muestra el mensaje de objetivo no válido: si no dice nada, la persona no sabe por qué no se ha guardado.
- **RF-2.7** Cuando la persona confirma un objetivo válido, el sistema lo guarda y lo aplica a la semana en curso sin necesidad de reiniciar la aplicación.
- **RF-2.8** Mientras haya un objetivo vigente, la persona puede cambiarlo **en cualquier momento de la semana**, incluso varias veces.
- **RF-2.9** Si el objetivo indicado es menor que los minutos ya registrados de la semana, el sistema lo acepta **en el mismo gesto**: no pide un segundo sí, no muestra un diálogo aparte y el estado pasa a cumplido (RF-3.3).
- **RF-2.10** Si el sistema usa el valor por defecto, **lo marca como tal en la etiqueta** (RF-9.1), de modo que se distinga de un objetivo que la persona haya confirmado.
- **RF-2.11** Si una persona que nunca ha fijado objetivo registra su primera sesión, el objetivo vigente sigue siendo el valor por defecto hasta que confirme un valor propio.

**Formas que se rechazan (RF-2.4)**

| Forma escrita | Resultado | Motivo |
|---|---|---|
| "30" | Aceptada | Entero escrito en cifras. |
| " 30 " | Aceptada | Los espacios alrededor no cambian el valor. |
| "30.0" | **Rechazada** | Lleva punto decimal: el objetivo es un entero y la forma con decimal no es un entero escrito en cifras. |
| "30,5" | **Rechazada** | No es un entero. |
| "1e3" | **Rechazada** | Notación exponencial: el navegador la puede leer como 1000 y una lectura de entero como 1, y la pantalla no puede afirmar cuál de las dos cosas quiere la persona. |
| "+30" | **Rechazada** | Lleva signo: no es un entero escrito en cifras. |
| "030" | Aceptada | Cero a la izquierda: sigue siendo el entero 30. |
| "30 min" | **Rechazada** | La unidad ya la pone la pantalla. |
| "" (vacío) | **Rechazada** | No hay valor que guardar (RF-2.6). |

**El máximo de 10080 es un tope de seguridad, no una imposibilidad**: como varias sesiones del mismo día suman entre sí, una semana sí puede superar los 10080 minutos. El tope existe para rechazar metas absurdas escritas por error.

### RF-3 — Progreso sobre el objetivo

- **RF-3.1** Mientras exista un objetivo vigente, el sistema muestra una **barra** que representa la proporción entre los minutos registrados y el objetivo, la **etiqueta del objetivo** (que lleva la marca de valor por defecto cuando lo es, RF-2.10) y, mientras la meta esté en curso, el valor del objetivo dentro de la línea de minutos registrados.
- **RF-3.2** Mientras los minutos registrados sean menores que el objetivo, el sistema muestra el **estado en curso** y los minutos por registrar, cuyo valor es exactamente la diferencia entre el objetivo y los minutos registrados.
- **RF-3.3** Mientras los minutos registrados alcancen o superen el objetivo, el sistema muestra el **estado cumplido** y la barra al 100 %, y **retira la línea que compara con el objetivo y la línea de minutos por registrar**: no se muestra el exceso, ni cero restante, ni cifras negativas. Mientras la meta esté cumplida, el valor del objetivo no aparece como cifra, para que la pantalla no sugiera cuántos minutos de más hay; el objetivo sigue identificado por su etiqueta y su valor se ve en el campo de edición.
- **RF-3.4** La línea de minutos registrados se muestra en los dos estados: en meta en curso como "Llevas X min registrados de Y min" y en meta cumplida como "Llevas X min registrados", **sin comparar con el objetivo**.
- **RF-3.5** La barra llega al 100 % exactamente cuando los minutos registrados alcanzan o superan el objetivo, y **no crece por encima** de ese punto.
- **RF-3.6** Si el objetivo cambia a mitad de semana, el progreso se recalcula **contra el objetivo nuevo** y usando **todos los minutos registrados de esa semana**, incluidos los registrados antes del cambio.
- **RF-3.7** Si ese recálculo hace que la barra retroceda o avance de golpe, el sistema muestra el estado que resulta y **no descarta ni oculta** los minutos anteriores al cambio.
- **RF-3.8** Si el objetivo nuevo queda en un valor igual o menor que los minutos registrados, el estado pasa a cumplido en el momento del cambio, sin estados intermedios.
- **RF-3.9** El progreso se recalcula cuando la persona añade, edita o elimina una sesión, sin que tenga que recargar la página.
- **RF-3.10** Si una sesión editada cambia de fecha y entra o sale de la semana en curso, los minutos registrados y el progreso se ajustan en consecuencia.
- **RF-3.11** Siempre lo que muestra el progreso se expresa **en términos de las sesiones registradas** (RF-9.7): el sistema no afirma que la persona haya estudiado más ni menos de lo que indican los datos.

### RF-4 — Cambio de semana y alcance temporal

- **RF-4.1** Cuando cambia la semana en curso, los minutos registrados pasan a contar **solo desde el nuevo lunes**: la semana anterior no arrastra minutos a la nueva.
- **RF-4.2** Al cambiar de semana, el objetivo vigente **se mantiene**: la semana nueva empieza con el mismo objetivo que había en la anterior. Si nunca se fijó ninguno, la semana nueva empieza con el valor por defecto de 30 minutos.
- **RF-4.3** Siempre, al existir un único objetivo guardado, el objetivo vigente después del cambio de semana es **exactamente el mismo valor que había antes**, porque es el mismo dato almacenado. Por tanto, arrastrar el objetivo a la semana nueva no exige guardar nada nuevo ni ninguna acción: es el comportamiento natural de conservar el valor.
- **RF-4.4** Al cambiar de semana, los minutos registrados son **0 salvo que ya haya sesiones válidas con fecha del nuevo lunes o posterior dentro de esa semana**, y el estado es en curso mientras esos minutos sean menores que el objetivo.
- **RF-4.5** Siempre, **dentro de esta funcionalidad**, el día de hoy se obtiene en un único punto de lectura del reloj, y ese punto **no es una función de cálculo**: su resultado se entrega como parámetro a todos los cálculos del objetivo (RF-1.3). Esta spec **no unifica** las lecturas de reloj que ya existen en el código entregado (RNF-5), y el objetivo no depende de ninguna de ellas.
- **RF-4.6** Mientras la aplicación esté abierta, el sistema **vuelve a leer el reloj** en dos momentos: cuando la página recupera el foco y cada vez que la persona añade, edita o elimina una sesión.
- **RF-4.7** Si en una de esas lecturas el día actual pertenece a una **semana distinta** de la que se usó en la última lectura, el sistema vuelve a pintar el objetivo y el progreso con la fecha nueva.
- **RF-4.8** Si la aplicación permanece abierta durante el cambio de semana sin que se dé ninguno de esos dos momentos, la vista **sigue mostrando la semana anterior** hasta la siguiente lectura del reloj, y solo entonces cambia. No hay ningún temporizador que repinte por su cuenta.
- **RF-4.9** Siempre la aplicación muestra **únicamente la semana en curso**: no guarda un registro de objetivos por semana, no conserva instantáneas de objetivos anteriores y no ofrece consultar el cumplimiento de semanas pasadas.

### RF-5 — Una sola cifra de minutos de la semana

- **RF-5.1** Los minutos registrados que pinta la línea del objetivo y los que hay detrás de la barra y del estado **son el mismo valor**, obtenido de un único cálculo con las mismas reglas: el mismo filtro de validez (RF-6) y el mismo día de hoy recibido como parámetro (RF-1.3). Nunca hay dos cifras distintas del mismo dato en pantalla.
- **RF-5.2** Si existen sesiones no válidas, **el valor pintado y el del cálculo las excluyen por igual**: la línea y la barra no pueden discrepar.
- **RF-5.3** Mientras la funcionalidad de objetivo esté visible, ni el objetivo ni el progreso permiten crear, editar ni eliminar sesiones: la meta solo se compara con lo ya registrado.
- **RF-5.4** El objetivo **no altera** las sesiones guardadas ni ninguna de las otras cifras de la aplicación (racha actual, mejor racha y días del mes).
- **RF-5.5** Siempre la cifra de minutos de la semana **excluye las sesiones no válidas** (RF-6). Este es un **cambio de comportamiento deliberado**, no un efecto colateral: la cifra que hoy se muestra como "Esta semana" las suma tal cual y puede mostrar un valor mayor. A partir de ahora puede mostrar **menos**, y el aviso existente del mapa de calor indica cuántas se han dejado fuera.

### RF-6 — Datos que no permiten afirmar nada

- **RF-6.1** Si una sesión **no es válida** según la definición de la sección 4, el sistema la excluye del cálculo de los minutos registrados y del progreso, con el mismo criterio que ya aplica el mapa de calor.
- **RF-6.2** Si el almacenamiento de sesiones contiene elementos que no tienen la forma de una sesión (por ejemplo, valores vacíos, números, textos o listas), el objetivo y el progreso **siguen calculando** con las sesiones válidas que haya y **no se interrumpen**. La garantía de que la página entera se pinte con esos datos es de la spec 003.
- **RF-6.3** El aviso de sesiones no válidas es **el mismo que ya muestra el mapa de calor**, con su texto y su recuento. El objetivo **no añade un segundo aviso** de este tipo en la tarjeta de racha.
- **RF-6.4** El número del aviso cuenta **todas las sesiones no válidas guardadas**, no solo las de la semana en curso, y es el mismo número que muestra el mapa de calor: la pantalla no muestra dos recuentos distintos de lo mismo.
- **RF-6.5** El aviso usa la forma en singular cuando el número es uno ("Se han ignorado 1 sesión...") y la forma en plural cuando es mayor.
- **RF-6.6** Mientras se muestren el objetivo o el progreso semanal, el sistema **no afirma que la persona no estudió** ni que no va a poder cumplir por falta de estudio: solo afirma qué minutos hay registrados y qué falta por registrar. La ausencia de datos no demuestra ausencia de estudio.
- **RF-6.7** El aviso de RF-6.3 informa de **cuántos registros se han ignorado**, y no afirma que esos días no se estudiaran ni culpa a la persona del dato corrupto.
- **RF-6.8** El texto propio del mapa de calor sobre días sin registro **no se modifica en esta spec**: el mapa es una funcionalidad ya entregada y **regida por la spec 001** (constitución 7). Corregirlo, si procede, es una spec de cambio aparte.

### RF-7 — Guardado del objetivo

- **RF-7.1** El objetivo se guarda en un **almacenamiento independiente** del de las sesiones, de modo que añadir esta funcionalidad no obliga a tocar los datos de estudio.
- **RF-7.2** Siempre los datos de sesiones ya guardados se conservan **sin modificar y sin migrar**: ni su contenido ni su formato cambian por la presencia del objetivo.
- **RF-7.3** Si el almacenamiento del objetivo está vacío, el sistema **no escribe nada** y usa el valor por defecto (RF-7.6).
- **RF-7.4** El objetivo se conserva al cerrar y volver a abrir la aplicación.
- **RF-7.5** Si el objetivo no se puede guardar, el sistema **informa con el mensaje de error de guardado** (RF-9.1) y **mantiene el objetivo vigente** que hubiera antes.
- **RF-7.6** Siempre la **consulta** del objetivo no escribe nada: abrir y usar la aplicación sin cambiar el objetivo no crea ni modifica ninguna entrada de almacenamiento.
- **RF-7.7** Si el objetivo guardado **no se puede leer** o **no es válido** (está vacío, es texto, tiene decimales o queda fuera del intervalo), el sistema lo trata como objetivo no definido, **usa el valor por defecto**, lo **marca como valor por defecto** y **muestra el aviso de objetivo ilegible** (RF-9.1), sin quedarse en silencio con un valor que la persona no eligió.
- **RF-7.8** Siempre el valor por defecto **no se persiste**: mientras la persona no confirme un objetivo propio, el almacenamiento del objetivo permanece sin escribir. Motivo: si se guardara, dejaría de ser posible distinguir un objetivo elegido de un valor por defecto, y la marca de RF-2.10 dejaría de ser cierta.

### RF-8 — Dónde se muestra el objetivo y cómo se edita

- **RF-8.1** Siempre el objetivo y su progreso se muestran **dentro de la tarjeta de racha**, en el hueco que ocupa hoy la estadística "Esta semana".
- **RF-8.2** Como siempre hay un objetivo vigente (RF-2.3), la tarjeta de racha **deja de mostrar por separado la estadística "Esta semana"**: ese hueco pasa a mostrar la etiqueta del objetivo, los minutos registrados, la barra, el estado y el botón "Cambiar objetivo". No hay dos cifras del mismo dato en pantalla.
- **RF-8.3** Mientras la persona no esté editando, se ven la etiqueta del objetivo, los minutos registrados, la barra, el estado y el botón "Cambiar objetivo", y **no se ve ningún campo ni botón de guardado o cancelación**.
- **RF-8.4** Cuando la persona pulsa el botón de editar, aparece **un único campo de minutos** con el objetivo vigente y los botones de guardar y cancelar.
- **RF-8.5** Al guardar, el sistema guarda el valor, sale de la edición y muestra el objetivo nuevo, y al cancelar sale de la edición **sin guardar nada** y con el objetivo vigente intacto.
- **RF-8.6** El botón de guardar **también se activa con la tecla Intro**; ningún otro atajo guarda el objetivo.
- **RF-8.7** La funcionalidad **no añade una sección nueva** a la página ni altera el orden de las pantallas existentes.

### RF-9 — Textos visibles

- **RF-9.1** Siempre los textos que ve la persona al usar el objetivo son los de esta tabla, y no hay otros.

| Elemento | Texto en pantalla |
|---|---|
| Etiqueta del objetivo | "Objetivo semanal" |
| Etiqueta cuando el valor es por defecto | "Objetivo semanal (30 min por defecto)" |
| Minutos registrados, meta en curso | "Llevas 45 min registrados de 300 min" |
| Minutos por registrar | "Te faltan 255 min por registrar" |
| Minutos registrados, meta cumplida | "Llevas 12000 min registrados" |
| Estado cumplido | "Meta cumplida" |
| Botón para editar | "Cambiar objetivo" |
| Etiqueta del campo de edición | "Objetivo en minutos" |
| Botón de confirmar | "Guardar" |
| Botón de cancelar | "Cancelar" |
| Mensaje de objetivo no válido | "Introduce un número de minutos entre 1 y 10080." |
| Aviso de objetivo guardado ilegible | "No se ha podido leer el objetivo guardado. Se usan 30 min por defecto." |
| Mensaje de error de guardado | "No se ha podido guardar el objetivo." |
| Aviso de sesiones ilegibles | "No se han podido leer las sesiones guardadas." |
| Aviso de sesiones no válidas | El mismo aviso que ya muestra el mapa de calor (RF-6.3), sin variantes nuevas. |

Los números cambian con los datos; el resto del texto es fijo. Los textos sustitutos de entradas malformadas no están aquí: son de la spec 003, que es la que repara la lista.

- **RF-9.2** Siempre las cifras de minutos en pantalla se abrevian como **"min"**: se escribe "45 min" y nunca "45 minutos" junto a una cifra.
- **RF-9.3** Si un texto en prosa menciona la unidad sin ir pegada a una cifra, puede escribir "minutos" completo: es el caso del mensaje de objetivo no válido.
- **RF-9.4** Mientras el estado sea cumplido, el texto es **"Meta cumplida"** con la línea "Llevas X min registrados", y **no se ven** ni la comparación con el objetivo ni la línea "Te faltan X min por registrar".
- **RF-9.5** Mientras el estado sea en curso, el texto de minutos por registrar es **"Te faltan X min por registrar"**, con X igual a la diferencia exacta entre el objetivo y los minutos registrados.
- **RF-9.6** Si la persona cancela la edición, el objetivo vigente **no cambia** y no queda ningún mensaje en pantalla.
- **RF-9.7** Siempre los textos del progreso hablan de **lo registrado**: no afirman que la persona haya estudiado exactamente esas cantidades, ni que no haya estudiado cuando no hay datos (RF-3.11).

### RF-10 — Almacenamiento ilegible en la lectura del objetivo

> Un único criterio para lo que el objetivo lee: **vacío** no es lo mismo que **ilegible**. La lectura es una función pura nueva, con sus pruebas, y **no repara** el almacenamiento.

- **RF-10.1** Siempre la lectura del objetivo **no lanza errores**: si el texto guardado no se puede interpretar, o el valor leído no es una lista, devuelve una lista vacía y marca el almacenamiento como ilegible, en lugar de propagar el fallo.
- **RF-10.2** Si el almacenamiento de sesiones está **vacío** (no hay nada guardado, el texto guardado está vacío o la lista no tiene elementos), no hay nada ilegible: el objetivo se muestra con 0 minutos registrados, la barra vacía y el estado en curso, y **no se muestra el aviso de sesiones ilegibles**.
- **RF-10.3** Si el almacenamiento de sesiones **no se puede interpretar** o **no es una lista**, el objetivo se muestra con 0 minutos registrados, la barra vacía, el estado en curso y **el aviso de sesiones ilegibles** (RF-9.1). Mientras esté en ese estado, el sistema **no afirma que la persona no estudió** (RF-6.6).
- **RF-10.4** Si el almacenamiento de sesiones es una lista que contiene elementos sin forma de sesión (valores vacíos, números, textos, listas o elementos **sin fecha**), el objetivo **excluye esos elementos del cálculo** y **sigue sumando las sesiones válidas que sí hay**: muestra los minutos registrados de las sesiones válidas de la semana, que **no son 0** si hay alguna, y el único aviso es el del mapa de calor (RF-6.3).
- **RF-10.5** El objetivo **no añade en la tarjeta de racha ningún aviso de sesiones no válidas**: ese aviso es el del mapa de calor (RF-6.3). El aviso de sesiones **ilegibles** sí se muestra en la tarjeta, porque el mapa de calor no lo muestra y ninguna otra parte de la aplicación lo mostraría.
- **RF-10.6** El objetivo **no reescribe ni repara** el almacenamiento de sesiones para arreglar un contenido corrupto: solo lo lee de forma defensiva, y el contenido guardado se queda como está.
- **RF-10.7** El bloque del objetivo **se pinta por sí mismo al abrir la página**, con un arranque propio que se ejecuta al cargar su script, **sin depender de que el resto de la aplicación llegue a pintarse**. Motivo: si el resto de la aplicación no puede leer el almacenamiento y se detiene, el objetivo se muestra igualmente con 0 minutos registrados y su aviso (RF-10.3).
- **RF-10.8** El arranque propio y el refresco desde la aplicación **coexisten sin pisarse**: si el refresco llega después, repinta el bloque entero por encima de lo que ya mostraba el arranque, y si no llega nunca, el estado del arranque se queda en pantalla sin errores.
- **RF-10.9** Mientras el arranque propio no haya podido leer el almacenamiento, el objetivo **no afirma nada sobre el estudio de la persona**: solo informa de que no ha podido leer las sesiones (RF-6.6).


---

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| **RNF-1** | El objetivo y su progreso deben ser **legibles y utilizables en pantalla de móvil**, evaluado con una anchura de **375 píxeles** y comprobado también a **1280 píxeles**, sin anchuras intermedias obligatorias. |
| **RNF-2** | El estado del progreso (en curso / cumplido) debe distinguirse **sin depender del color únicamente**, para no excluir a personas con daltonismo. |
| **RNF-3** | Fijar y consultar el objetivo debe ser operable **solo con teclado**, y el objetivo y el progreso deben anunciarse a un lector de pantalla. |
| **RNF-4** | El cálculo de los minutos registrados y del progreso debe ser una **función pura sin efectos sobre estado**, apta para verificarse de forma aislada. |
| **RNF-5** | Conforme al principio 3 de la constitución, **toda función de cálculo nueva de esta spec recibe "hoy" como parámetro y no lee el reloj del sistema**. Dos ejecuciones con los mismos datos y la misma fecha dan siempre el mismo resultado. Esta exigencia **no alcanza a las funciones ya entregadas** que leen el reloj: esas no se reescriben aquí (constitución 7) y su resultado no se usa como base del cálculo del objetivo. |
| **RNF-6** | La lógica de minutos registrados, de cambio de semana, de objetivo y de progreso debe quedar **cubierta por pruebas automáticas** que se ejecuten sin instalar nada adicional, con la fecha de hoy pasada explícitamente. |
| **RNF-7** | La aplicación debe seguir **funcionando abriendo la página directamente**, sin servidor ni paso de compilación. La medición de rendimiento con 2000 sesiones es de la spec 003. |
| **RNF-8** | Ninguna funcionalidad nueva debe **alterar los datos ya guardados** por la persona. |
| **RNF-9** | Los textos visibles del objetivo y del progreso están en **español**, escritos directamente en la página y sin capa de traducción. |
| **RNF-10** | Si la representación del progreso introduce movimiento o transición, se respeta la **opción de movimiento reducido** del sistema y el resultado es legible también sin animación. |
| **RNF-11** | Conforme al principio 6 de la constitución, el **código nuevo va en inglés** (nombres de función, variables, parámetros, constantes, ficheros y comentarios) y **las pruebas también**, porque son código. Los literales de pantalla se escriben en español directamente. |
| **RNF-12** | El código heredado que está en español **no se copia** al escribir la funcionalidad nueva ni **se traduce** de paso: traducirlo es una tarea propia, para no mezclarla con una funcionalidad. |

---

## 7. Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Usuario que nunca ha fijado un objetivo | Se muestra "Objetivo semanal (30 min por defecto)" y el progreso se calcula con 30 minutos. |
| Usuario con sesiones y sin objetivo guardado | Se aplica el valor por defecto, marcado como tal; no se pide nada ni se muestra un estado vacío. |
| Abrir la aplicación sin objetivo guardado | Se muestra el valor por defecto y **no se escribe nada** en el almacenamiento del objetivo. |
| Guardar la primera sesión sin haber fijado objetivo | El objetivo sigue siendo el valor por defecto y los minutos registrados suman. |
| Usar la aplicación a diario sin confirmar un objetivo | El almacenamiento del objetivo **sigue vacío** y la etiqueta **sigue marcando** el valor por defecto. |
| Objetivo guardado ilegible, con texto, con decimales o fuera de intervalo | Se usa el valor por defecto, marcado como tal, y se muestra el aviso de objetivo ilegible. |
| Campo de edición confirmado vacío | Se rechaza, no se guarda nada, el objetivo vigente no cambia y se muestra el mensaje de objetivo no válido. |
| Escribir "1e3", "+30", "30 min" o "30.5" | Se rechaza con el mensaje de objetivo no válido. |
| Escribir "030" o " 30 " | Se acepta y se guarda 30. |
| Cancelar la edición | El objetivo vigente no cambia y no queda ningún mensaje en pantalla. |
| Guardar con el objetivo por debajo de los minutos registrados | Se guarda en el mismo gesto, sin diálogo, y el estado pasa a cumplido. |
| Guardar con el objetivo por encima de 10080 | Se rechaza con el mensaje de objetivo no válido y el objetivo vigente no cambia. |
| No se puede guardar el objetivo | Se muestra el mensaje de error de guardado y el objetivo vigente no cambia. |
| Cambio de semana con la aplicación abierta | Los minutos registrados cuentan desde el nuevo lunes, el objetivo sigue siendo el mismo y la barra vuelve a cero. |
| Cambio de semana sin objetivo fijado nunca | La semana nueva empieza con el valor por defecto de 30 minutos. |
| Cambio de semana con sesiones ya registradas a fecha del nuevo lunes | Los minutos registrados no son cero: suman las sesiones válidas de la semana nueva. |
| Cambio del objetivo a mitad de semana hacia un valor mayor | El progreso retrocede de golpe: se recalcula con todos los minutos registrados, incluidos los anteriores al cambio. |
| Cambio del objetivo a mitad de semana hacia un valor menor | El progreso avanza de golpe y puede pasar a cumplido en el momento del cambio. |
| Cambio del objetivo mientras la meta ya está cumplida | El progreso se recalcula con el objetivo nuevo y con todos los minutos registrados de la semana. |
| Cambio del objetivo tres veces en la misma semana | Cada cambio se aplica sobre el total de la semana; ninguno descarta minutos. |
| Cambio del objetivo el mismo día en que empieza la semana | El objetivo nuevo se aplica a la semana nueva, cuyos minutos registrados son 0 salvo sesiones de ese mismo día. |
| Aplicación abierta durante el cambio de semana, sin retorno de foco ni interacción | La vista sigue mostrando la semana anterior hasta la siguiente lectura del reloj (al recuperar el foco o al guardar una sesión), y solo entonces cambia. |
| Aplicación abierta durante el cambio de semana y la persona vuelve a la pestaña | Al recuperar el foco, la vista salta a la semana nueva. |
| Domingo último de la semana | Cuenta la semana entera (lunes a domingo), que ha transcurrido por completo. |
| Cambio de mes dentro de la semana | La semana no se parte: cuenta como una sola semana. |
| 31 de diciembre y 1 de enero | La semana que cruza el año nuevo se trata como una sola semana, con su lunes correspondiente. |
| Cambio de hora de verano (último domingo de marzo y de octubre) | No se desplaza ningún día ni se pierde ninguna sesión. |
| Cambio de zona horaria del dispositivo | No se desplaza ningún día ni cambia el total de la semana. |
| Fecha del sistema desfasada respecto a la real | "Hoy" es el valor leído en el punto de lectura del reloj; los cálculos no lo consultan por su cuenta. |
| Sesión registrada con fecha futura | No suma a los minutos registrados ni al progreso, y cuenta en el aviso existente. |
| Sesión del martes de una semana que aún no ha empezado | No suma: su fecha es posterior a hoy. |
| Varias sesiones el mismo día | Suman entre sí para un único total de la semana. |
| Dos o más sesiones idénticas en fecha, tema y minutos | Se cuentan todas. |
| Sesión de 1440 minutos exactos | Es válida: no supera el límite de un día. |
| Sesión de 1441 minutos | Se excluye por dato imposible y cuenta en el aviso existente. |
| Minutos con decimales, texto o cero | La sesión se excluye del cálculo del objetivo y no altera lo que se pinta en su bloque. |
| Elementos guardados que no son sesiones (vacíos, números, listas) | Se tratan como no válidos, no suman, se cuentan en el aviso existente y el bloque del objetivo se sigue mostrando. Que la página entera se pinte es de la spec 003. |
| Una sola sesión no válida en todo el almacenamiento | El aviso existente usa la forma en singular: "Se han ignorado 1 sesión...". |
| Sesiones no válidas y minutos de la semana | El número que se ve en pantalla y el del progreso coinciden, y ambos las excluyen. La cifra puede ser **menor que la suma de todo lo registrado**, y el aviso existente indica cuántas se han ignorado. |
| Objetivo de 1 minuto | Válido; en cuanto se registra 1 minuto, la meta está cumplida. |
| Objetivo de 10080 minutos | Válido: es el máximo admitido. |
| Objetivo de 0, negativo, decimal o con texto | Se rechaza con el mensaje de objetivo no válido y no se guarda nada. |
| Objetivo de 10081 minutos o más | Se rechaza por superar el máximo de seguridad, con el mensaje de objetivo no válido. |
| Objetivo guardado menor que los minutos registrados | Se acepta; la barra queda al 100 % y desaparecen la comparación con el objetivo y los minutos por registrar. |
| Minutos registrados exactamente iguales al objetivo | Estado cumplido: la barra llega al 100 %, el texto pasa a "Meta cumplida" y la línea "Te faltan X min por registrar" desaparece. |
| Minutos registrados muy por encima del objetivo | Estado cumplido, barra al 100 % y sin exceso en pantalla: la línea muestra solo "Llevas X min registrados". |
| Meta cumplida y valor del objetivo | El valor del objetivo **no aparece como cifra** en la tarjeta: se ve en el campo de edición al pedirla, y la etiqueta solo lleva la marca de valor por defecto cuando lo es. |
| Un minuto por debajo del objetivo | Estado en curso con 1 minuto por registrar. |
| Editar una sesión y moverla fuera de la semana en curso | Los minutos registrados de la semana bajan en la cantidad correspondiente. |
| Borrar la sesión que había completado la meta | El progreso vuelve al estado en curso o cumplido que corresponda. |
| Almacenamiento de sesiones vacío, con texto vacío o con lista vacía | La lectura del objetivo lo distingue de ilegible: 0 minutos registrados y **ningún aviso**. |
| Lista del objetivo con elementos malformados y sesiones válidas | El objetivo excluye los malformados y **sigue sumando las válidas**: muestra los minutos de las válidas, no 0 si hay alguna. |
| Usuario sin ninguna sesión | Los minutos registrados son 0 y la barra queda vacía, en estado en curso. |
| Usuario con sesiones solo de semanas pasadas | Los minutos registrados de la semana en curso son 0. |
| Datos de sesiones guardados con el formato anterior | Todas las sesiones se siguen leyendo y mostrando igual, sin cambio de formato. |
| Año bisiesto dentro de la semana | El 29 de febrero se cuenta si cae dentro de la semana en curso. |

---

## 8. Fuera de alcance

Queda explícitamente **excluido** de esta versión:

- Objetivos diarios, por tema o por día de la semana: el objetivo es **semanal**.
- Objetivos distintos por semana: hay un único objetivo, y no puede haber dos metas vigentes a la vez.
- Consultar o listar el cumplimiento de semanas pasadas, y cualquier histórico de objetivos: solo se ve la semana en curso.
- Quitar el objetivo o desactivarlo: siempre hay un objetivo vigente, y si no hay ninguno guardado se aplica el valor por defecto.
- Cualquier cambio en el **mapa de calor** ya entregado: ni su lógica, ni sus textos, ni su rejilla, ni su lectura del almacén. Cualquier mejora suya es una spec aparte (constitución 7). La lectura defensiva compartida con el objetivo es de la spec 003.
- **Buscar, filtrar o ordenar** las sesiones de la lista, y cualquier cambio en su apariencia: todo eso es de la spec 003.
- **La traducción de `app.js` al inglés**: sigue siendo una tarea aparte, con su propio criterio de finalización. En esta spec no se traduce nada.
- **Registrar la hora de una sesión**: hoy la sesión solo guarda una fecha, sin hora, así que el caso de una sesión registrada a las 00:30 no puede darse. Guardar la hora es una spec aparte.
- La **reparación del almacenamiento heredado y el pintado robusto de la lista de sesiones**: son el alcance entero de la spec 003, incluida la excepción a la constitución 7.
- El **borrado de `calcularMinutosSemana`**, que aquí solo queda sin uso.
- Cualquier tipo de aviso, recordatorio o notificación que se muestre fuera de la propia página.
- Recompensas, premios o marcas por cumplir el objetivo, y su efecto sobre la racha.
- Cálculo automático del objetivo a partir del historial, o sugerencias de objetivo.
- Alertas del tipo "falta poco para acabar la semana" o "ya no queda tiempo": el objetivo informa, no avisa.
- Objetivos plurisemanales, mensuales o por un periodo distinto de la semana.
- Crear, editar o eliminar sesiones desde la zona del objetivo.
- Exportar o imprimir el objetivo.
- Cualquier dato que no provenga de las sesiones ya registradas.

### Qué se toca en `app.js`

Esta spec **no repara el almacenamiento heredado** y **no modifica la lista de sesiones**. La excepción a la constitución 7 que antes contenía esos tres puntos se trasladó **íntegra** a `specs/003-resilient-session-list/spec.md`: el arreglo de la lectura de `app.js`, el pintado robusto de la lista y la eliminación de `calcularMinutosSemana`.

Lo que esta spec toca en `app.js` son **dos líneas**, y solo dos:

1. **Quita** la llamada a la estadística "Esta semana" en `renderizar()`, porque su nodo desaparece del HTML con RF-8.2. Si se dejara, la aplicación intentaría pintar un elemento que ya no existe.
2. **Añade** al final de `renderizar()` la llamada que refresca el objetivo cuando la persona añade, edita o borra una sesión (RF-3.9).

El arranque propio del objetivo (RF-10.7) **no necesita tocar `app.js`**: vive dentro del script de la interfaz del objetivo y se ejecuta al cargarse, igual que hace el mapa de calor. La función `calcularMinutosSemana` **no se borra aquí**: queda sin uso y su eliminación es de la spec 003, con su propio criterio. Tampoco se traduce `app.js`: eso es tarea aparte en cualquier caso.

---

## 9. Decisiones pendientes de revisión

> **No queda ninguna decisión pendiente.** Todas están confirmadas y están en la sección 11, y las que había abierto el asistente se han convertido en requisitos cerrados (RF-2.10, RF-7.8, RF-8.3 a RF-8.6, RF-4.6 a RF-4.8, RF-10.1 a RF-10.6).
> Esta sección se conserva por estructura y recoge únicamente las **características conocidas del código ya entregado que esta spec no va a tocar**. No son defectos del objetivo semanal y no se corrigen aquí.

**OBSERVACIÓN — El mapa de calor afirma que no se estudió**
El detalle de un día sin sesiones registradas dice literalmente que no se estudió ese día (`heatmap-ui.js`). Choca con la regla de MEMORY.md: nunca afirmar sobre los datos del usuario algo que el dato no demuestra. **No se corrige en esta spec**, porque es código entregado y la spec 001 lo exige así. Corregirlo requiere una **spec de cambio**, con su propio criterio de finalización.

**OBSERVACIÓN — La lectura heredada del almacén puede romper la página**
La lectura de sesiones de `app.js` sigue interpretando el almacenamiento sin protección, así que un texto no interpretable, un valor que no es una lista o una entrada sin fecha pueden impedir que la página se pinte. **Esta spec no lo arregla**: su lectura propia es una función pura nueva y está probada (RF-10.1), pero el resto de la aplicación sigue como está. El arreglo íntegro está en la **spec 003**, con la excepción a la constitución 7 que aquí ya no aplica.

---

## 10. Criterios de finalización

La funcionalidad se considera terminada cuando:

1. Todos los **RF-1 a RF-10** cumplen sus criterios de aceptación.
2. Las **pruebas de la lógica** están escritas, pasan y cubren al menos: semana de lunes a domingo, exclusión de fechas futuras, estados en curso y cumplido, valor por defecto de 30 minutos, rechazo de las formas no admitidas y de los valores fuera de 1 a 10080, ajuste retroactivo del progreso al cambiar el objetivo a mitad de semana, cambio de semana, sesiones no válidas de varios tipos, objetivo guardado ilegible y almacenamiento vacío frente a ilegible.
3. Las pruebas **pasan la fecha de hoy explícitamente como parámetro** y ninguna depende del reloj del sistema: ejecutarlas con una fecha fija produce el mismo resultado hoy y dentro de un año.
4. No existen **pruebas en rojo**.
5. Se ha comprobado, con un almacenamiento legible que contiene sesiones válidas y sesiones no válidas, que la **cifra que se ve en pantalla es idéntica** a la que está detrás del progreso.
6. Se ha comprobado el **cambio de comportamiento deliberado**: con sesiones no válidas, la cifra de la semana muestra **menos** que antes de esta funcionalidad, y el aviso del mapa de calor indica cuántas se han ignorado.
7. La tarjeta de racha **no muestra ningún aviso de sesiones no válidas**: ese aviso es el del mapa de calor, con su texto, su número sobre todo el almacenamiento y su variante de singular o plural (RF-6.3). En cambio, con la lectura **ilegible** sí muestra el aviso de sesiones ilegibles y con la lectura **vacía** no muestra ninguno (RF-10.2, RF-10.3 y RF-10.5).
8. Con el almacenamiento del objetivo vacío, la aplicación muestra **30 minutos por defecto**, lo **marca como tal** y, tras usarla, **sigue sin haber escrito nada** en ese almacenamiento.
9. Con un objetivo guardado ilegible, la aplicación muestra el **valor por defecto marcado**, muestra el aviso de objetivo ilegible y **no se queda en silencio**.
10. Se ha comprobado que, tras cambiar el objetivo a mitad de semana, el progreso se recalcula **con todos los minutos ya registrados de esa semana**, incluidos los anteriores al cambio, y que la barra refleja el nuevo estado sin estados intermedios.
11. Se ha comprobado que la meta cumplida **no muestra ni comparación con el objetivo ni minutos por registrar**, tampoco cuando los minutos registrados superan el objetivo.
12. Se ha comprobado que el objetivo se **conserva** al cerrar y reabrir la aplicación, y que sigue siendo el mismo al cambiar de semana.
13. Se ha comprobado que **ninguna sesión guardada se ha perdido ni ha cambiado de formato** con esta implementación: el objetivo y su arranque **solo leen** la clave de sesiones y nunca escriben en ella. Que las entradas malformadas **sigan apareciendo en la lista y se puedan corregir** es de la spec 003.
14. Los textos de pantalla son **exactamente los de la tabla de RF-9.1**, sin variantes, y todas las cifras de minutos van abreviadas como **"min"**, nunca como "minutos".
15. El objetivo se ve **dentro de la tarjeta de racha**, en el hueco de la estadística "Esta semana", y la página **no ha ganado ninguna sección nueva**.
16. El objetivo y el progreso son **operables solo con teclado** y se anuncian a un lector de pantalla, y su estado se distingue sin depender solo del color.
17. **Verificación mínima en navegador**: con un almacenamiento legible y válido, la página se ha comprobado a 1280 píxeles y a 375 píxeles, el bloque del objetivo se ve completo y funciona en ambas, y la consola no muestra errores. Es el mínimo que exige `AGENTS.md` para cualquier pantalla nueva.
18. Si hay movimiento o transición, se ha verificado su comportamiento con la **opción de movimiento reducido** activada en el sistema.
19. Se ha revisado que **todo el código nuevo, incluidos los nombres y los comentarios, está en inglés**, y que los literales de pantalla están en español. Los identificadores y las clases del HTML y del CSS siguen el patrón heredado del proyecto y quedan fuera de esta comprobación.
20. Se ha comprobado que en `app.js` se han tocado **exactamente dos líneas**: se ha quitado la llamada a la estadística "Esta semana" y se ha añadido el aviso al objetivo. Ninguna más, y no se ha traducido nada.
21. La documentación del proyecto refleja la nueva funcionalidad.
22. Se ha comprobado el **arranque propio con almacenamiento ilegible**: la tarjeta de racha muestra 0 minutos registrados, la barra vacía, el estado en curso y el aviso de sesiones ilegibles, y **ningún error de consola procede del objetivo**. Los errores que pueda producir el resto de la aplicación con esos datos son de la spec 003.

---

## 11. Decisiones ya resueltas

> Decisiones confirmadas por la persona usuaria, más las confirmadas al reabrir esta spec tras la revisión del plan. **No queda ninguna decisión pendiente de confirmación**: todo lo que estaba abierto ha pasado a requisito cerrado, y la sección 9 solo recoge observaciones sobre código ya entregado.
>
> **Cambios de esta reapertura (14 de octubre de 2026)**: se quitaron el RF-11 y los cuatro textos sustitutos de la lista, y los criterios que dependían del arreglo del almacenamiento, porque esos contenidos pasaron a la spec 003. La excepción a la constitución 7 se trasladó **íntegra** a esa spec: aquí `app.js` se toca en dos líneas y nada más.

| Tema | Decisión |
|---|---|
| Cuántos objetivos | **Uno solo**, no uno por semana. Se cambia en cualquier momento de la semana, incluso varias veces. |
| Valor por defecto | **30 minutos** cuando no hay objetivo guardado, marcados como valor por defecto en la etiqueta. |
| Dónde se muestra | **Dentro de la tarjeta de racha**, en el hueco de la estadística "Esta semana", que desaparece. Sin secciones nuevas (RF-8). |
| Tope del objetivo | De **1 a 10080 minutos**, como **tope de seguridad**, no como imposibilidad: una semana sí puede superar los 10080 minutos. |
| Forma admitida del objetivo | Un **entero escrito en cifras**. Se rechazan la notación exponencial, el signo más, los decimales y las unidades (RF-2.4). |
| Cambio de semana | El objetivo **se arrastra** a la semana nueva. Como solo hay un valor guardado, arrastrar es conservar ese mismo valor: no hace falta guardar nada nuevo (RF-4.3). |
| Cambio de objetivo a mitad de semana | El progreso se recalcula contra el objetivo nuevo usando **todos los minutos ya registrados de esa semana**, incluidos los anteriores al cambio. La barra puede retroceder o avanzar de golpe, y eso es lo esperado (RF-3.6 a RF-3.8). |
| Objetivo superado | La barra se queda **al 100 %**, el estado pasa a **cumplido** y **no se muestra el exceso** ni los minutos por registrar. |
| Textos visibles | Los de la tabla de **RF-9.1**, con todas las cifras de minutos abreviadas como **"min"**. |
| Lenguaje del progreso | Habla de **minutos registrados**: no afirma más de lo que los datos demuestran (RF-9.7). |
| Cifra de minutos de la semana | **Una sola**, ya filtrada y con "hoy" como parámetro, que alimenta a la vez la tarjeta y el progreso. Como **cambio de comportamiento deliberado**, puede mostrar un valor **menor** que antes cuando hay sesiones no válidas (RF-5.5). |
| Aviso de sesiones no válidas | El **mismo** que ya muestra el mapa de calor, con su número sobre todo el almacenamiento. El objetivo no añade otro (RF-6.3). |
| Aviso de sesiones ilegibles | Texto propio junto al objetivo: "No se han podido leer las sesiones guardadas." (RF-10.3). |
| Marca de valor por defecto | La etiqueta dice "Objetivo semanal (30 min por defecto)" hasta que la persona confirme un valor propio (RF-2.10). |
| El valor por defecto se persiste | **No**: el almacenamiento del objetivo no se escribe hasta que la persona confirme un valor (RF-7.8). |
| Flujo de edición | Botón "Cambiar objetivo", campo con el valor vigente, botones "Guardar" y "Cancelar", e Intro también guarda. Cancelar sale sin guardar (RF-8.3 a RF-8.6). |
| Cambio de semana con la aplicación abierta | **Sin temporizador**: el reloj se relee al recuperar el foco de la pestaña y en cada alta, edición o borrado (RF-4.6 a RF-4.8). |
| Arreglo de la lectura heredada del almacén | **No entra en esta spec**: vive en la spec 003, con la excepción a la constitución 7. Aquí solo hay una lectura propia, pura y probada (RF-10.1). |
| Lista de sesiones con entradas malformadas | **No entra en esta spec**: vive en la spec 003, con sus cuatro textos sustitutos. |
| `app.js` | Se toca **en dos líneas**: deja de llamar a la estadística "Esta semana" porque su nodo desaparece (RF-8.2) y añade el aviso al objetivo (RF-3.9). `calcularMinutosSemana` queda sin uso y **su borrado es de la spec 003**. |
| Almacenamiento vacío e ilegible | No son lo mismo: vacío es 0 minutos registrados **sin aviso**; ilegible es 0 minutos registrados **con aviso** (RF-10.2 y RF-10.3). |
| Lista con elementos malformados | Se excluyen los malformados y **se siguen sumando las sesiones válidas**: el objetivo no cae a 0 (RF-10.4). |
| Dónde se guarda | **Clave nueva e independiente** de la de las sesiones. El formato de lo ya guardado **no se toca ni se migra**. |
| Alcance temporal | **Solo la semana en curso.** Sin histórico de semanas, sin consulta de semanas anteriores y sin instantáneas del objetivo por semana. |
| Datos no válidos | No cuentan para el progreso ni para la cifra de la semana, con el aviso existente, y **nunca se borran**. |
| Semana | De **lunes a domingo**, en hora local, con las sesiones futuras excluidas del cálculo. |