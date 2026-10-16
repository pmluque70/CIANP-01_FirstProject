# Spec 003 — Lista de sesiones que no se rompe

Estado: borrador. Primera versión, extraída de la spec 002 al dividirla.
Constitution: `docs/constitution.md` (debe cumplirse en su totalidad)
Código de referencia: la spec 001 (mapa de calor) **ya está implementada y en producción** (v1.8.0) y la spec 002 **ya está aprobada**. Esta spec se apoya en las dos, usa la lectura pura que la 002 crea y **no deroga ninguna**.

> Esta spec describe **qué** se hace y **por qué**. El stack, la arquitectura y los nombres de los ficheros van en el plan.
> Todas las decisiones están tomadas. Las de producto están en la sección 11 y la excepción a la constitución 7 está en la sección 8, con su motivo declarado.

---

## 1. Contexto y objetivo

La aplicación lee las sesiones de `localStorage` y las dibuja en una lista. Hoy esa lectura **no está protegida**: si lo guardado no se puede interpretar, no es una lista, o una entrada no tiene fecha, la aplicación **se rompe antes de pintar nada**.

Eso choca de frente con dos cosas del proyecto:

1. **El aviso del mapa de calor ya entregado** dice que las sesiones descartadas "siguen visibles en la lista de sesiones, donde puedes corregirlas". Si la lista no aparece, ese texto es **falso**.
2. **Los datos del usuario son sagrados** (constitución 5). Una entrada corrupta no puede desaparecer: la persona tiene que poder verla y borrarla.

El objetivo es que **la aplicación nunca se rompa por el contenido guardado**:

- Una **lectura defensiva** única, compartida por el mapa, el objetivo y la lista, que nunca lanza errores y que distingue **vacío** de **ilegible**.
- Una **lista que se pinta siempre**, con textos sustitutos para lo que una entrada no tiene, sin inventar fecha, tema ni minutos, y sin borrar nada.
- **Quitar el código muerto** que deja de tener uso cuando la estadística "Esta semana" desaparece con la spec 002.

No se añaden funcionalidades a la lista: ni búsqueda, ni orden, ni filtros. Es una reparación.

---

## 2. Usuarios

| Usuario | Necesidad |
|---|---|
| **Usuario principal** — persona que estudia a diario y usa el diario como vínculo de hábito | Notar que la aplicación **nunca se rompe**, ni aunque el almacenamiento se corrompiera |
| **Usuario secundario** — persona que ya tiene datos guardados desde hace tiempo, algunos de ellos antiguos o editados a mano | Poder **ver y borrar** una entrada corrupta, en lugar de encontrarse con una página en blanco |

No hay otros perfiles previstos. No se contempla el uso compartido ni por varias personas sobre los mismos datos.

---

## 3. Historias de usuario

**HU-1 — Ver la aplicación aunque algo esté mal**
Como usuario, quiero que la aplicación se abra siempre, para no quedarme sin poder registrar o consultar mis sesiones.

**HU-2 — Ver el registro que no se puede entender**
Como usuario, quiero ver la entrada que está mal guardada, aunque no tenga todos sus datos, para saber que existe y poder borrarla.

**HU-3 — No perder nada por un dato corrupto**
Como usuario, quiero que un registro defectuoso no desaparezca ni se modifique solo, para no perder datos sin enterarme.

**HU-4 — Saber que hay algo que revisar**
Como usuario, quiero que me avisen si hay registros que no se han podido usar, para ir a corregirlos.

---

## 4. Definiciones

- **Entrada guardada**: cada elemento del array que hay en el almacenamiento de sesiones. Puede estar bien o mal.
- **Entrada malformada**: una que no es un objeto, o que no tiene fecha legible, o cuyos minutos no son un número entero. Una entrada sin tema **no** está malformada.
- **Almacenamiento vacío**: no hay nada guardado, o lo guardado es texto vacío, o es una lista sin elementos.
- **Almacenamiento ilegible**: lo guardado no se puede interpretar, o no es una lista.
- **Texto sustituto**: el texto que muestra la lista en el hueco que una entrada no puede llenar. Nunca inventa el dato que falta.

---

## 5. Requisitos funcionales

> Criterios de aceptación en notación EARS.
> `Cuando` = evento · `Mientras` = estado · `Siempre` = invariante · `Si` = comportamiento no deseado · `Dónde` = funcionalidad opcional.

### RF-1 — Una lectura única y defensiva

- **RF-1.1** Siempre la lectura de sesiones **no lanza errores**, sea cual sea el contenido guardado.
- **RF-1.2** Si el almacenamiento está **vacío**, la lectura devuelve una lista vacía y lo marca como vacío.
- **RF-1.3** Si el almacenamiento **no se puede interpretar** o **no es una lista**, la lectura devuelve una lista vacía y lo marca como ilegible.
- **RF-1.4** Si el almacenamiento es una lista, la lectura la devuelve **sin filtrar ni modificar**: las entradas malformadas **se conservan** tal cual.
- **RF-1.5** Siempre el mapa de calor, el objetivo semanal y la lista de sesiones **usan la misma lectura**, de modo que ninguna de las tres puede fallar donde las otras funcionan.
- **RF-1.6** La lectura **no reescribe ni repara** el almacenamiento: solo lo lee.

### RF-2 — La lista se pinta siempre

- **RF-2.1** Siempre la lista de sesiones **se pinta completa**, aunque el almacenamiento contenga entradas malformadas: ninguna entrada puede impedir que la página aparezca.
- **RF-2.2** Si una entrada **no es un objeto** (valor vacío, número, texto o lista), la lista muestra el texto "Registro ilegible" en los tres huecos y **no intenta leer ningún campo**.
- **RF-2.3** Si una entrada **no tiene fecha legible**, la lista muestra "Registro sin fecha" en el hueco de la fecha, y el tema y los minutos se muestran si existen.
- **RF-2.4** Si una entrada **no tiene tema**, la lista muestra "Sin tema" en el hueco del tema.
- **RF-2.5** Si una entrada **no tiene minutos válidos** (no es un número entero), la lista muestra "Sin minutos" en el hueco de los minutos, y **no se calcula** nada con ese valor.
- **RF-2.6** Si una entrada tiene **fecha y minutos válidos pero no tema**, se pinta como las demás y **sí cuenta** para la racha, los minutos de la semana, los días del mes y el objetivo semanal.
- **RF-2.7** Mientras la lista esté visible, toda entrada, malformada o no, se puede **borrar** desde ella con la misma confirmación que el resto, y borrarla **no afecta a las demás entradas**.
- **RF-2.8** Siempre una entrada malformada **no se borra ni se modifica** por el hecho de pintarse.
- **RF-2.9** Si una entrada malformada se **edita** y se completa con fecha, tema y minutos válidos, deja de estar malformada y pasa a pintarse y a contar con normalidad.

### RF-3 — Aviso de registros que no se han podido usar

- **RF-3.1** El aviso de sesiones no válidas es **el mismo que ya muestra el mapa de calor**, con su texto, su número y su variante de singular o plural. La lista **no añade** un aviso propio.
- **RF-3.2** El aviso informa de **cuántos registros se han ignorado** y de que siguen visibles en la lista, y **no afirma** que esos días no se estudiaran.

### RF-4 — Textos visibles

- **RF-4.1** Siempre los textos que sustituyen a datos que una entrada no tiene son los de esta tabla, y no hay otros textos nuevos.

| Elemento | Texto en pantalla |
|---|---|
| Entrada que no es una sesión | "Registro ilegible" |
| Entrada sin fecha legible | "Registro sin fecha" |
| Entrada sin tema | "Sin tema" |
| Entrada sin minutos válidos | "Sin minutos" |

- **RF-4.2** Ninguno de esos textos lleva cifras, así que la regla de abreviación de minutos de la spec 002 no les aplica.
- **RF-4.3** El aviso de registros ignorados es el del mapa de calor, sin variantes nuevas.

### RF-5 — Quitar el código muerto

- **RF-5.1** Cuando la estadística "Esta semana" deja de pintarse, su función de cálculo **se elimina** del fichero heredado, porque se queda sin ningún uso.
- **RF-5.2** La eliminación **no cambia el comportamiento** de la aplicación: la función ya no se llama desde ningún sitio.
- **RF-5.3** La eliminación **no reescribe** el código heredado en otro idioma: desaparece, no se traduce.

---

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| **RNF-1** | La lista y sus textos sustitutos deben ser **legibles en pantalla de móvil**, comprobado a **375 píxeles** y a **1280 píxeles**. |
| **RNF-2** | Un texto sustituto debe distinguirse de un dato real **sin depender solo del color**, para no confundir a quien tiene daltonismo. |
| **RNF-3** | Los botones de editar y borrar de una fila malformada siguen siendo **operables con teclado** y anunciables a un lector de pantalla, igual que en las filas normales. |
| **RNF-4** | La lógica de la lectura y del modelo de fila debe ser una **función pura sin efectos sobre estado**, apta para verificarse de forma aislada. |
| **RNF-5** | Conforme al principio 3 de la constitución, **toda función de cálculo recibe "hoy" como parámetro y no lee el reloj del sistema**. |
| **RNF-6** | La lectura defensiva y el modelo de fila deben quedar **cubiertos por pruebas automáticas** que se ejecuten sin instalar nada, con la fecha de hoy pasada explícitamente. |
| **RNF-7** | La aplicación debe seguir **funcionando abriendo la página directamente**, sin servidor ni paso de compilación. Con **2000 sesiones guardadas**, el tiempo que tardan en pintarse la lista y el objetivo **no es mayor** que el que tardaban antes de esta funcionalidad, medido con las herramientas de desarrollo del navegador **en el mismo equipo y con los mismos datos**. |
| **RNF-8** | Ningún cambio puede **alterar los datos ya guardados** por la persona: ni borrarlos, ni modificarlos, ni migrarlos. |
| **RNF-9** | Los textos visibles de los textos sustituto están en **español**. |
| **RNF-10** | Si la reparación introduce movimiento o transición, se respeta la **opción de movimiento reducido** del sistema. |
| **RNF-11** | Conforme al principio 6 de la constitución, el **código nuevo va en inglés** y las pruebas también. Los cambios en el fichero heredado están en la excepción declarada de la sección 8 y se escriben en español a propósito. |
| **RNF-12** | La traducción del fichero heredado al inglés **sigue siendo tarea aparte**: esta spec no la hace. |

---

## 7. Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Almacenamiento con texto que no se puede interpretar | La página se pinta entera y no da ningún error en consola |
| Almacenamiento que es un objeto o un número, no una lista | Cuenta como ilegible: la página se pinta entera, sin errores y sin datos inventados |
| Almacenamiento vacío, con texto vacío o con lista vacía | La lista aparece vacía y sin errores, sin aviso ilegible |
| Lista con un elemento `null` en mitad de sesiones válidas | El elemento se pinta como "Registro ilegible" y las demás sesiones se pintan y cuentan con normalidad |
| Lista con un número o un texto como elemento | Igual que el valor vacío: "Registro ilegible" y sin leer campos |
| Lista con una entrada sin fecha | La fecha se sustituye por "Registro sin fecha" y el resto de la entrada se pinta si existe |
| Lista con una entrada sin tema | Se sustituye por "Sin tema" y la entrada cuenta si su fecha y sus minutos son válidos |
| Lista con una entrada con minutos cero, negativos, con decimales o por encima de 1440 | Se sustituye por "Sin minutos" y no cuenta para nada |
| Lista con una entrada válida de 1440 minutos exactos | Se pinta y cuenta con normalidad |
| Borrar una entrada malformada | Se borra solo esa, con confirmación, y las demás siguen en su sitio |
| Editar una entrada malformada y completarla | Deja de estar malformada y pasa a contar |
| Almacenamiento no disponible o bloqueado | La página no se rompe ni borra nada, e informa del problema |
| Dos o más sesiones idénticas en fecha, tema y minutos | Se muestran todas y se cuentan todas |
| Almacenamiento con datos correctos | Todo se comporta exactamente igual que antes de esta spec |
| 2000 sesiones guardadas | La lista y el objetivo se pintan sin tardar más que antes |
| Cambio de zona horaria o de hora del dispositivo | No se desplaza ninguna fecha ni cambia ningún texto |
| Fecha del sistema desfasada respecto a la real | "Hoy" es el parámetro recibido; el reloj del sistema no interviene en ningún cálculo |

---

## 8. Fuera de alcance

Queda explícitamente **excluido** de esta versión:

- Buscar, filtrar, ordenar o paginar las sesiones de la lista.
- Cualquier otra apariencia de la lista que no sean los cuatro textos sustitutos de RF-4.
- Corregir, completar o inventar los datos que una entrada no tiene.
- Reparar el contenido guardado: la lectura solo lee, nunca escribe.
- Migrar el formato de los datos o añadir campos.
- Recuperar sesiones borradas desde el historial del navegador.
- La traducción del fichero heredado al inglés, que es tarea aparte (RNF-12).
- La reparación del texto del mapa de calor sobre días sin registro: es una spec de cambio aparte (RF-6.8 de la spec 002).

### Excepción acotada a la constitución 7

El principio 7 dice que el código heredado que incumple un pilar **no se corrige de paso**. Aquí hay una **excepción deliberada y acotada**, y no se disimula. Viene de la spec 002, donde estaba antes de que esta se dividiera:

- **Qué entra en esta spec**, y solo esto: (a) el arreglo de la lectura de sesiones heredada, que hoy puede romper la página al interpretar el almacén de sesiones en tres casos: un texto guardado que no se puede interpretar, un valor guardado que no es una lista y un elemento guardado sin fecha; (b) el pintado de la lista de sesiones para que una entrada malformada no impida ver, corregir ni borrar el resto (RF-2); y (c) la **eliminación de `calcularMinutosSemana`**, que la spec 002 dejó sin uso al desaparecer la estadística "Esta semana". Sin estos tres puntos, los criterios de esta spec serían **inalcanzables**, porque la página no llegaría ni a pintar nada.
- **Por qué no es una corrección de paso**: los tres están asumidos como parte del alcance y de los criterios de finalización, no como efecto colateral.
- **Su alcance es mínimo**: que la lectura y el pintado no lanzen errores y que el código muerto desaparezca. No cambia el comportamiento con datos correctos, no reescribe el contenido guardado y no toca ninguna otra función.
- **En qué idioma se escribe**: **en español**, porque el fichero heredado está en español. Es una **deuda asumida de forma consciente**: el pilar 6 pide el código en inglés, y estos cambios lo incumple a propósito y de forma declarada.
- **Qué sigue aparte**: la traducción del fichero heredado al inglés continúa siendo una tarea con su propio criterio de finalización (RNF-12), y `calcularMinutosSemana` desaparece sin más: no se reescribe en otro idioma, se borra.

---

## 9. Decisiones pendientes de revisión

> **No queda ninguna decisión pendiente.** Todas están confirmadas y están en la sección 11.
> Esta sección se conserva por estructura, y recoge una característica del código ya entregado que esta spec **no va a tocar**.

**OBSERVACIÓN — El mapa de calor afirma que no se estudia**
El detalle de un día sin sesiones registradas dice literalmente que no se estudió ese día (`heatmap-ui.js`). Choca con la regla de MEMORY.md: nunca afirmar sobre los datos del usuario algo que el dato no demuestra. **No se corrige aquí**, porque es código entregado y la spec 001 lo exige así. Corregirlo requiere una spec de cambio, con su propio criterio de finalización.

---

## 10. Criterios de finalización

La funcionalidad se considera terminada cuando:

1. Todos los **RF-1 a RF-5** cumplen sus criterios de aceptación.
2. Las **pruebas de la lógica** están escritas y pasan, y cubren al menos: almacenamiento vacío, ilegible, lista correcta, lista con `null`, con número, con texto, con lista, entrada sin fecha, sin tema, con minutos no válidos, entrada válida de 1440 minutos y entrada con fecha y minutos válidos pero sin tema.
3. Las pruebas **pasan la fecha de hoy explícitamente como parámetro** y ninguna depende del reloj del sistema: ejecutarlas con una fecha fija produce el mismo resultado hoy y dentro de un año.
4. No existen **pruebas en rojo**, ni las de esta spec ni las de las specs anteriores, que siguen en verde.
5. El mapa de calor, el objetivo semanal y la lista de sesiones **usan la misma lectura**, y se ha comprobado en el código que no queda ninguna otra lectura del almacén.
6. Con un texto guardado que no se puede interpretar, o con un valor que no es una lista, la página **se pinta entera y la consola no muestra errores**.
7. Con una lista que mezcla entradas malformadas y sesiones válidas, la página se pinta entera, **las sesiones válidas siguen pintándose y contando**, y la consola no muestra errores.
8. Los cuatro textos sustitutos son **exactamente los de la tabla de RF-4.1**, sin variantes, y cada uno aparece en el hueco que le corresponde.
9. Una entrada con fecha y minutos válidos pero **sin tema** se pinta y **cuenta** para el objetivo, y al editarla para completar el tema deja de estar malformada.
10. Se ha comprobado que una entrada malformada **se puede borrar desde la lista** y que al borrarla **no desaparece ninguna otra**.
11. Se ha comprobado que **ninguna sesión guardada se ha perdido ni ha cambiado de formato**, incluidas las malformadas, que siguen apareciendo en la lista.
12. El aviso de registros ignorados es **solo el del mapa de calor**, con su texto, su número y su variante de singular o plural, y la lista no añade otro.
13. `calcularMinutosSemana` **ha desaparecido** del fichero heredado y la aplicación se comporta igual, y no se ha traducido nada más.
14. La lista y sus textos son **legibles a 375 píxeles y a 1280 píxeles**, y los botones de editar y borrar de una fila malformada son operables con teclado.
15. Con 2000 sesiones guardadas, el pintado de la lista y del objetivo **no tarda más** que antes de esta funcionalidad, medido con las herramientas de desarrollo en el mismo equipo y con los mismos datos.
16. Se ha revisado que **todo el código nuevo, incluidos los nombres y los comentarios, está en inglés**, que los textos visibles están en español y que los cambios en el fichero heredado están en español de forma declarada, dentro de la excepción de la sección 8.
17. La documentación del proyecto refleja la reparación y la excepción declarada.

---

## 11. Decisiones ya resueltas

> Decisiones tomadas por la persona usuaria y confirmadas al dividir la spec 002.

| Tema | Decisión |
|---|---|
| Alcance | La **lista que no se rompe**, la **lectura defensiva** y el **borrado del código muerto**. La verificación pesada viene con la spec, porque es lo que permite dar por buena la reparación. |
| Excepción a la constitución 7 | Se traslada **íntegra** desde la spec 002, con sus tres puntos y con la deuda declarada de escribirlos en español. |
| Un solo texto sustituto o cuatro | **Cuatro**: "Registro ilegible", "Registro sin fecha", "Sin tema" y "Sin minutos". Un solo texto obligaría a inventar datos que no existen. |
| Esconder las entradas malformadas | **No**: el aviso del mapa de calor ya promete que se ven en la lista, y esconderlas lo volvería falso además de perder datos. |
| Borrar las entradas corruptas | **Solo si la persona lo decide**: la lectura nunca escribe, y borrarlas al vuelo está prohibido por la constitución 5. |
| Entrada sin tema | **Cuenta** si su fecha y sus minutos son válidos: lo que falta es el tema, no el estudio. |
| Una lectura o varias | **Una sola lectura**, compartida por el mapa, el objetivo y la lista, para que no puedan divergir. |
| `calcularMinutosSemana` | Se **borra**, no se traduce ni se reutiliza. |
| Traducción del fichero heredado | Sigue siendo **tarea aparte** (RNF-12). |
| Mapa de calor | Se le cambia **una línea**: su lectura pasa a ser la compartida. Nada más. |