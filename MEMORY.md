# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- v1.7.0: registrar, editar y borrar sesiones; racha actual, mejor racha, minutos semanales, días del mes, versión en footer y favicon.
- Interfaz rediseñada con la skill `frontend-design`: tarjeta de racha oscura, estadísticas en rejilla, llama SVG, grano sutil y animaciones escalonadas.
- Datos en localStorage, clave `diarioEstudio_sesiones`.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha visible aunque sea igual que la actual: es motivador ver que "estás en tu mejor momento".
- Semana empieza en lunes: convención más común en España.
- Todas las estadísticas en la tarjeta de racha: visibles sin hacer scroll.
- Versión en formato x.y.z en el footer: permite distinguir versiones de un vistazo.
- Tipografía del sistema, sin Google Fonts: la web tiene que funcionar sin conexión.
- Paleta naranja (#ff6b35) con tarjeta de racha oscura: la racha es el punto focal de la página.
- Favicon y llama en SVG (sin emoji): escalable y sin depender de la fuente de emoji del sistema.
- Animaciones declaradas en CSS; el JS solo dispara la del número cuando cambia. Nada de librerías: el proyecto debe seguir abriendo con doble clic.
- Los hovers van dentro de `@media (hover: hover)` y se acompañan de `:active`: en móvil los hovers no existen.
- `prefers-reduced-motion` respetado: si el usuario tiene los efectos de Windows desactivados, las animaciones no se ejecutan.
- Las animaciones de carga duran ~1,8s en total: hay que verlas en los primeros segundos. La llama late en bucle cada 2,2s, así que siempre se ve movimiento.
- El número de la racha rebota (`mostrarValor` en app.js) cada vez que su valor cambia, no solo al cargar: es cuando el usuario está mirando.
- Las sesiones se identifican por su índice en la lista ordenada, no con un id. Así no se toca el formato de lo guardado en localStorage. Si algún día hay que reordenar o paginar, habrá que añadir un id (preguntando antes).
- Borrar pide confirmación con `confirm()` nativo: incluye fecha, tema y minutos para no borrar por error.
## Aprendizajes y errores a evitar
- AGENTS.md tenía la clave de localStorage y los nombres de campo en inglés, pero el código real usa español. Corregido en v1.1.
- `innerHTML = ''` en `renderizar()` recrea los `<li>`: para animarlos hay que animar el elemento, no esperar una transición del contenedor.
- Antes de dar por hecha una animación: comprobar si el sistema tiene los efectos desactivados, y recordar que en táctil no hay hover.
## Próximos pasos
- (vacío por ahora)