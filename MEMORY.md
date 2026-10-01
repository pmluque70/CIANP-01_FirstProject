# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- v1.2 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha histórica, minutos semanales y lista de sesiones.
- Datos en localStorage.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha visible aunque sea igual que la actual: es motivador ver que "estás en tu mejor momento".
- Mejor racha como badge discreto debajo de la racha actual.
- Semana empieza en lunes: convención más común en España.
- Minutos semanales en la sección de racha: visible sin hacer scroll.
## Aprendizajes y errores a evitar
- AGENTS.md tenía la clave de localStorage y los nombres de campo en inglés, pero el código real usa español. Corregido en v1.1.
## Próximos pasos
- (vacío por ahora)
