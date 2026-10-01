# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- v1.4.0 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha histórica, minutos semanales, dias del mes, lista de sesiones, version en footer y favicon.
- Datos en localStorage.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha visible aunque sea igual que la actual: es motivador ver que "estás en tu mejor momento".
- Mejor racha como badge discreto debajo de la racha actual.
- Semana empieza en lunes: convención más común en España.
- Minutos semanales en la sección de racha: visible sin hacer scroll.
- Dias del mes en la sección de racha: mismo motivo.
- Version en formato x.y.z en el footer: permite distinguir versiones de un vistazo.
- Favicon SVG con emoji: ligero, escalable y coherente con la tematica.
- Paleta de color azul (#3b82f6): transmite confianza y estabilidad, apropiada para un diario de estudio.
## Aprendizajes y errores a evitar
- AGENTS.md tenia la clave de localStorage y los nombres de campo en ingles, pero el codigo real usa espanol. Corregido en v1.1.
## Próximos pasos
- (vacio por ahora)
