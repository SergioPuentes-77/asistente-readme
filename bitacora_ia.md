# Bitácora de uso de IA

Proyecto: Asistente de documentación (README) para proyectos de clase
Estudiante: Sergio Andrés Puentes González
Funcionalidad: HU-01 Excluir archivos con claves antes de enviar el proyecto a la IA
Asistente usado: Claude (Anthropic), modo agente

> Nota de transparencia: esta bitácora registra lo que ocurrió en la sesión de trabajo con el asistente, que
> escribió el contrato, las pruebas, el código y el refactor siguiendo el diseño del estudiante (ADR-001,
> ADR-002 y el documento de requisitos de la semana 3). Las decisiones de cada entrada se tomaron durante esa
> sesión. El estudiante debe leer el código y poder explicarlo.

## Entradas

### Entrada 1

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso escribir las pruebas con el ejecutor que ya trae Node (`node:test` y `assert`) y no con Jest.
- **Decisión:** Aceptada
- **Por qué:** El servicio local es Node.js (ADR-001). `node:test` viene incluido desde Node 18, no agrega dependencias y deja `npm test` como un solo comando.
- **Verificación:** `npm test` ejecutó las 12 pruebas con Node v22; en el commit en rojo se vieron las 12 fallar.
- **Commit relacionado:** c5c32ab, «Pruebas de HU-01, excluir archivos con claves (en rojo)»

### Entrada 2

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «A partir del contrato del README, escribe las pruebas de HU-01 antes del código: casos normales, casos límite y el caso de error del escenario 2.» El asistente propuso 12 pruebas, entre ellas rutas de Windows, un archivo llamado `.environment.js`, una clave con valor vacío y la comparación `password == 'x'`.
- **Decisión:** Aceptada
- **Por qué:** Cubren el contrato completo: 4 casos normales, 2 de error (el escenario 2 del criterio y los datos inválidos) y 6 límite. Varios de los límite no estaban a la vista antes de escribir el código.
- **Verificación:** Se contaron las pruebas por tipo contra el contrato del README y se ejecutaron en rojo: 12 pruebas, 0 pasan, 12 fallan.
- **Commit relacionado:** c5c32ab

### Entrada 3

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «Implementa `revisarArchivos` en `servicio-local/src/revisarArchivos.js` con el contrato del README y las 12 pruebas como contexto. Sin dependencias.» El asistente escribió una primera versión con una expresión regular `/(API_KEY|PASSWORD)\s*=\s*\S+/i`.
- **Decisión:** Aceptada con cambios
- **Por qué:** La primera versión pasó 11 de 12 pruebas. Fallaba la de `password == 'x'` porque la expresión tomaba el segundo `=` como valor de la clave. Se agregó `(?!=)` después del `=` y no se tocó ninguna prueba.
- **Verificación:** `npm test` pasó de 11 pruebas en verde y 1 en rojo a 12 en verde; `git diff` de la carpeta de pruebas quedó vacío.
- **Commit relacionado:** 59467f7, «Implementación de revisarArchivos para HU-01 (pruebas en verde)»

### Entrada 4

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente consideró usar una librería de detección de secretos (por ejemplo secretlint o gitleaks) en lugar de la expresión regular.
- **Decisión:** Rechazada
- **Por qué:** Agrega una dependencia para detectar solo dos patrones. RNF-02 pide exactamente `API_KEY=` y `PASSWORD=`, y el proyecto no tiene presupuesto ni necesidad de más reglas.
- **Verificación:** La implementación con una expresión regular pasó las 12 pruebas y `package.json` no tiene dependencias.
- **Commit relacionado:** 59467f7

### Entrada 5

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso leer también el contenido de los `.env` para decir en qué línea está cada clave.
- **Decisión:** Rechazada
- **Por qué:** El escenario 1 de HU-01 pide excluir el archivo sin más, y el ADR-002 dice que nunca se guarda ni se muestra el valor de una clave. Leerlo no aporta nada al criterio.
- **Verificación:** La primera prueba incluye un `.env` con `DB_PASSWORD=abc123` y exige que no haya bloqueos; pasa.
- **Commit relacionado:** 59467f7

### Entrada 6

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso detectar también claves «por aleatoriedad» (cadenas largas que parecen contraseñas), no solo por el nombre.
- **Decisión:** Rechazada
- **Por qué:** Ni HU-01 ni RNF-02 lo piden, y daría falsos positivos que bloquearían envíos válidos. Queda como posible mejora si el cliente lo pide.
- **Verificación:** Se revisaron el criterio de aceptación y RNF-02: solo piden dos patrones. Ninguna de las 12 pruebas necesita esta regla.
- **Commit relacionado:** 59467f7

### Entrada 7

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «Con las pruebas en verde, refactoriza: nombres claros, elimina los valores mágicos y divide la función larga.» El asistente movió los textos y patrones a constantes y separó cinco funciones pequeñas.
- **Decisión:** Aceptada
- **Por qué:** La función hacía validar, buscar claves y armar el mensaje a la vez, con una expresión regular suelta. Con funciones pequeñas cada regla se lee sola.
- **Verificación:** `npm test` siguió en 12 pruebas en verde y `git diff 59467f7 -- servicio-local/test` salió vacío (no se modificó ninguna prueba).
- **Commit relacionado:** 7af2419, «Refactor: constantes con nombre y funciones pequeñas en revisarArchivos»

### Entrada 8 (semana 6)

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Eres revisor de seguridad de código. Lee solo este archivo... Revisa inyección, secretos, contraseñas, control de acceso, dependencias y robustez ante entradas maliciosas. Responde con tabla Id, línea, problema, categoría, severidad y arreglo; separa los hallazgos seguros de las sospechas y comprueba cada uno con node.» Lo recibió una segunda sesión de IA que solo vio `revisarArchivos.js`. Devolvió 8 hallazgos (H1 a H8) y 4 sospechas.
- **Decisión:** Aceptada con cambios
- **Por qué:** 3 hallazgos eran reales y de seguridad o robustez (`.ENV` en mayúsculas, saltos `\r`, objeto que cambia entre lecturas) y se corrigieron. Los demás se anotaron como pendientes: unos están fuera del contrato (claves con `:`) y otros fallan hacia el lado seguro o tienen impacto muy bajo. La IA no vio `.gitignore` ni `package.json`, y por eso no encontró el problema de `.env.example`.
- **Verificación:** Cada hallazgo se contrastó ejecutando la función con una entrada de abuso. La búsqueda de expresiones regulares lentas (que la IA descartó) se repitió con 200 000 espacios: menos de 1 ms. Detalle en `revision_seguridad.md`, sección 3.
- **Commit relacionado:** e816919, «Informe de revisión de seguridad»

### Entrada 9 (semana 6)

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** El hallazgo H1 de la revisión: `.ENV` no se excluye. Primero se escribió la prueba de abuso, que falló (en rojo), y luego se pidió la corrección al asistente de código.
- **Decisión:** Aceptada
- **Por qué:** Es el hallazgo más grave: en Windows y macOS `.ENV` es el mismo archivo que `.env`, y un archivo con `DB_URL=` (sin `API_KEY` ni `PASSWORD`) se habría enviado a la IA. La corrección es mínima: comparar el nombre en minúsculas.
- **Verificación:** La prueba «un archivo .ENV en mayúsculas también se excluye» pasó de rojo a verde; las 12 pruebas anteriores siguieron en verde y no se modificó ninguna de ellas (`git diff 8800075 -- servicio-local/test/revisarArchivos.test.js` sale vacío). Se agregó otra prueba para que `.ENVIRONMENT.js` no se excluya.
- **Commit relacionado:** 54668b0, «Fix H-01: excluir .env sin importar mayúsculas»

### Entrada 10 (semana 6)

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** Se usó una sesión de IA separada (subagente) solo para revisar, sin permiso de cambiar archivos. No hizo cambios de código, por eso no hubo rama ni diff que revisar. Además, el asistente intentó instalar ESLint 9 y el plugin de seguridad con `npm install`.
- **Decisión:** Rechazada (instalar) / Aceptada (revisión)
- **Por qué:** El entorno bloqueó el registro de npm (error 403 de la política de red). No se intentó saltar el bloqueo. Se dejó `eslint.config.js` y las versiones exactas en `package.json`, y se ejecutó el ESLint que ya había en el entorno con reglas nativas.
- **Verificación:** 0 avisos con las reglas nativas. El plugin `eslint-plugin-security` y `npm audit` quedan por ejecutar en el equipo del estudiante, y así se declara en `revision_seguridad.md`.
- **Commit relacionado:** 6e53ae0, «Linter con reglas de seguridad»

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 4 |
| Aceptadas con cambios | 2 |
| Rechazadas | 3 |
| Mixtas (entrada 10) | 1 |

## Errores que atraparon las pruebas

1. **Error real de la primera versión.** La prueba «una comparación como password == 'x' no cuenta como clave» falló
   (esperaba `permitido: true` y recibió `false`). La expresión `\s*=\s*\S+` aceptaba el segundo `=` de `==` como
   si fuera el valor de la clave, así que el filtro habría bloqueado código válido. Se corrigió con `(?!=)` y
   volvieron a pasar las 12 pruebas.
2. **Comprobación adicional, en una copia que no se subió.** Se hicieron tres cambios dañinos para ver si las
   pruebas los detectaban: numerar las líneas desde 0 (fallan 3 pruebas), quitar la opción que ignora
   mayúsculas (falla 1) y excluir todo lo que empiece con `.env` (falla 1, la de `.environment.js`).

## Reflexión final (5 a 8 líneas)

El asistente ayudó más al convertir el contrato en pruebas con casos límite que no estaban a la vista (rutas de Windows,
`.environment.js`, valor vacío, `==`) antes de escribir una sola línea de código. Las pruebas atraparon un error real
de la primera versión: la expresión regular trataba `password == 'x'` como una clave y habría bloqueado código válido.
Con las pruebas en verde el refactor fue seguro: cambiaron las constantes y las funciones, y los 12 resultados quedaron
iguales. Se rechazaron tres ideas que parecían más completas (una librería de secretos, leer el `.env` y detectar por
aleatoriedad) porque el diseño y el cliente solo pedían dos patrones. Lo que se haría diferente: pedir más casos de
error desde el principio, por ejemplo claves escritas con `:` como `"API_KEY": "abc"` en un JSON, que el patrón actual
no detecta, y leer la expresión regular con calma antes de ejecutarla, porque el error estaba justo ahí.
