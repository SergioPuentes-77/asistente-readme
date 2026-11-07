# Bitácora de uso de IA

Proyecto: Asistente de documentación (README) para proyectos de clase
Estudiante: Sergio Andrés Puentes González
Funcionalidad: HU-01 Excluir archivos con claves antes de enviar el proyecto a la IA
Asistente usado: Claude (Anthropic), modo chat

## Entradas

### Entrada 1

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso escribir las pruebas con el ejecutor que ya trae Node (`node:test` y `assert`) y no con Jest.
- **Decisión:** Aceptada
- **Por qué:** El servicio local es Node.js (ADR-001). `node:test` viene incluido desde Node 18, no agrega dependencias y deja `npm test` como un solo comando.
- **Verificación:** `npm test` ejecutó las 12 pruebas; en el commit en rojo se vieron las 12 fallar.
- **Commit relacionado:** «Pruebas de HU-01, excluir archivos con claves (en rojo)»

### Entrada 2

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «A partir del contrato del README, escribe las pruebas de HU-01 antes del código: casos normales, casos límite y el caso de error del escenario 2.» El asistente propuso 12 pruebas, entre ellas rutas de Windows, un archivo llamado `.environment.js`, una clave con valor vacío y la comparación `password == 'x'`.
- **Decisión:** Aceptada
- **Por qué:** Cubren el contrato completo: 4 casos normales, 2 de error (el escenario 2 del criterio y los datos inválidos) y 6 límite. Varios de los límite no estaban a la vista antes de escribir el código.
- **Verificación:** Se contaron las pruebas por tipo contra el contrato del README y se ejecutaron en rojo: 12 pruebas, 0 pasan, 12 fallan.
- **Commit relacionado:** «Pruebas de HU-01, excluir archivos con claves (en rojo)»

### Entrada 3

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «Implementa `revisarArchivos` en `servicio-local/src/revisarArchivos.js` con el contrato del README y las 12 pruebas como contexto. Sin dependencias.» El asistente escribió una primera versión con una expresión regular `/(API_KEY|PASSWORD)\s*=\s*\S+/i`.
- **Decisión:** Aceptada con cambios
- **Por qué:** La primera versión pasó 11 de 12 pruebas. Fallaba la de `password == 'x'` porque la expresión tomaba el segundo `=` como valor de la clave. Se agregó `(?!=)` después del `=` y no se tocó ninguna prueba.
- **Verificación:** `npm test` pasó de 11 pruebas en verde y 1 en rojo a 12 en verde; `git diff` de la carpeta de pruebas quedó vacío.
- **Commit relacionado:** «Implementación de revisarArchivos para HU-01 (pruebas en verde)»

### Entrada 4

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente consideró usar una librería de detección de secretos (por ejemplo secretlint o gitleaks) en lugar de la expresión regular.
- **Decisión:** Rechazada
- **Por qué:** Agrega una dependencia para detectar solo dos patrones. RNF-02 pide exactamente `API_KEY=` y `PASSWORD=`, y el proyecto no tiene presupuesto ni necesidad de más reglas.
- **Verificación:** La implementación con una expresión regular pasó las 12 pruebas y `package.json` no tiene dependencias.
- **Commit relacionado:** «Implementación de revisarArchivos para HU-01 (pruebas en verde)»

### Entrada 5

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso leer también el contenido de los `.env` para decir en qué línea está cada clave.
- **Decisión:** Rechazada
- **Por qué:** El escenario 1 de HU-01 pide excluir el archivo sin más, y el ADR-002 dice que nunca se guarda ni se muestra el valor de una clave. Leerlo no aporta nada al criterio.
- **Verificación:** La primera prueba incluye un `.env` con `DB_PASSWORD=abc123` y exige que no haya bloqueos; pasa.
- **Commit relacionado:** «Implementación de revisarArchivos para HU-01 (pruebas en verde)»

### Entrada 6

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso detectar también claves «por aleatoriedad» (cadenas largas que parecen contraseñas), no solo por el nombre.
- **Decisión:** Rechazada
- **Por qué:** Ni HU-01 ni RNF-02 lo piden, y daría falsos positivos que bloquearían envíos válidos. Queda como posible mejora si el cliente lo pide.
- **Verificación:** Se revisaron el criterio de aceptación y RNF-02: solo piden dos patrones. Ninguna de las 12 pruebas necesita esta regla.
- **Commit relacionado:** «Implementación de revisarArchivos para HU-01 (pruebas en verde)»

### Entrada 7

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «Con las pruebas en verde, refactoriza: nombres claros, elimina los valores mágicos y divide la función larga.» El asistente movió los textos y patrones a constantes y separó cinco funciones pequeñas.
- **Decisión:** Aceptada
- **Por qué:** La función hacía validar, buscar claves y armar el mensaje a la vez, con una expresión regular suelta. Con funciones pequeñas cada regla se lee sola.
- **Verificación:** `npm test` siguió en 12 pruebas en verde y `git diff` de la carpeta de pruebas salió vacío (no se modificó ninguna prueba).
- **Commit relacionado:** «Refactor: constantes con nombre y funciones pequeñas en revisarArchivos»

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 3 |
| Aceptadas con cambios | 1 |
| Rechazadas | 3 |

## Errores que atraparon las pruebas

La prueba «una comparación como password == 'x' no cuenta como clave» falló en la primera versión (esperaba
`permitido: true` y recibió `false`). La expresión `\s*=\s*\S+` aceptaba el segundo `=` de `==` como si fuera el
valor de la clave, así que el filtro habría bloqueado código válido. Se corrigió con `(?!=)` y volvieron a pasar
las 12 pruebas.

## Reflexión final (5 a 8 líneas)

El asistente ayudó más al convertir el contrato en pruebas con casos límite que no estaban a la vista (rutas de Windows,
`.environment.js`, valor vacío, `==`) antes de escribir una sola línea de código. Las pruebas atraparon un error real
de la primera versión: la expresión regular trataba `password == 'x'` como una clave y habría bloqueado código válido.
Con las pruebas en verde el refactor fue seguro: cambiaron las constantes y las funciones, y los 12 resultados quedaron
iguales. Se rechazaron tres ideas que parecían más completas (una librería de secretos, leer el `.env` y detectar por
aleatoriedad) porque el diseño y el cliente solo pedían dos patrones. Lo que se haría diferente: pedir más casos de
error desde el principio, por ejemplo claves escritas con `:` como `"API_KEY": "abc"` en un JSON, que el patrón actual
no detecta, y leer la expresión regular con calma antes de ejecutarla, porque el error estaba justo ahí.