# Constitución — Diario de Estudio
Principios innegociables. Toda spec, plan y tarea debe cumplirlos.
1. **Simplicidad primero**: HTML, CSS y JS puros. Sin dependencias ni build. Funciona abriendo index.html con doble clic.
2. **La spec manda**: nada se implementa si no está en la spec activa. Si falta una decisión, se para y se pregunta.
3. **Lógica separada de interfaz**: los cálculos (fechas, rachas, estadísticas) son funciones puras, sin DOM ni localStorage, que reciben "hoy" como parámetro.
4. **Tests como puerta**: la lógica se prueba con `node --test`, sin instalar paquetes. Prohibido avanzar con tests en rojo.
5. **Los datos del usuario son sagrados**: localStorage con compatibilidad hacia atrás y fechas siempre en hora local. Nunca se pierde una sesión.
6. **Idioma: el código en inglés, la persona en español**. Es un pilar, no una preferencia.
   - **En inglés**: nombres de función, variables, parámetros, constantes, nombres de fichero y comentarios del código.
   - **En español**: todo lo que ve la persona en pantalla, la documentación, las specs, los planes y los mensajes visibles.
   - Los identificadores nunca se traducen al español aunque el concepto tenga palabra común en castellano: se usa el término inglés (`render`, `build`, `parse`, `week`) y el término español solo cuando no existe equivalente razonable (`racha` no tiene traducción estándar en el dominio, así que se documenta).
   - **Ningún código nuevo puede escribirse en español**, aunque el código que lo rodea sí lo esté. Si al añadir una función hay que elegir entre seguir el idioma del vecino o el de la constitución, **manda la constitución**.
   - Los tests van en inglés por la misma razón: son código.
   - El texto de la interfaz se escribe directamente en español, sin capas de traducción. Cuando exista la necesidad de otros idiomas, será una spec nueva que cree la infraestructura; hasta entonces, los literales en español son la forma correcta, no una deuda.
7. **Compatibilidad con lo ya escrito**: el código heredado que incumple este pilar no se corrige de paso. Se deja como está, se marca como deuda y se migra en una tarea propia con su propio criterio de finalización.
## Especificaciones
- Cada spec vive en `specs/NNN-nombre-corto/spec.md`.
- `NNN` es el número de secuencia con tres dígitos, y `nombre-corto` un nombre corto en kebab-case que describa la funcionalidad (`001-heat-map`, `002-...`).
- Una spec solo describe **qué** se hace y **por qué**. El stack, la arquitectura y los nombres de los ficheros van en el plan, no aquí.