# Informe de revisión de código y seguridad

Proyecto: Asistente de documentación (README) para proyectos de clase (servicio local, HU-01)
Estudiante: Sergio Andrés Puentes González
Fecha: 2026-11-14
Commit revisado: 8800075 (antes de las correcciones)

## 1. Herramientas y criterios

- **Linter:** ESLint 9 con `eslint-plugin-security` 3 (equivalente en Node.js a ruff con reglas S) y las reglas `no-eval`, `no-implied-eval` y `no-new-func`. Configuración en `eslint.config.js`; se ejecuta con `npm run lint`.
  **Nota de honestidad:** en el entorno donde trabajó el asistente no había acceso al registro de npm, así que no se pudo instalar el plugin de seguridad. Allí se ejecutó ESLint 10.1 con reglas nativas (`no-eval`, `no-implied-eval`, `no-new-func`, `no-undef`, `no-unused-vars`, `no-prototype-builtins`, `no-control-regex`, `eqeqeq`, entre otras) sobre `servicio-local/` y la configuración: 0 avisos. La ejecución con el plugin completo queda para el equipo del estudiante (ver sección 4).
- **Auditoría de dependencias:** el proyecto no tiene dependencias de producción; solo ESLint y su plugin como herramientas de desarrollo, con versión fija. `npm audit` no se pudo ejecutar por la misma razón. Resultado en el equipo del estudiante: ______ (completar tras ejecutar `npm install` y `npm audit`).
- **Lista de revisión:** la de la semana 6 (corrección y pruebas, diseño y legibilidad, seguridad).
- **Revisión con IA:** una segunda sesión de Claude que solo recibió `revisarArchivos.js` y el contrato (ver sección 3).
- **Historial de git:** se buscaron en todos los commits patrones `API_KEY=`, `PASSWORD=`, `SECRET=` y `TOKEN=`. Solo aparecen valores de ejemplo falsos (`abc123`, `uno`, `dos`) en las pruebas y la documentación. Nunca se subió un archivo `.env`.

### Puntos de seguridad revisados

| Punto | ¿Aplica? | Resultado |
|---|---|---|
| Inyección (consultas con parámetros) | No: no hay base de datos, comandos ni HTML; la función solo procesa texto en memoria | Sin hallazgos. Sin `eval` ni `Function` (linter) |
| Secretos (código, historial, .gitignore, .env.example) | Sí | Sin claves en el código ni en el historial. `.gitignore` excluye `.env` y `.env.*`. Ver H-01 (el filtro mismo omitía `.ENV`) |
| Contraseñas (scrypt, bcrypt o argon2 con sal) | No: el sistema no guarda ni compara contraseñas, solo las detecta en texto | Sin hallazgos |
| Control de acceso (rol verificado y prueba de abuso) | No hay usuarios ni roles. El control que existe es el filtro de archivos | Se hicieron pruebas de abuso contra ese filtro: H-01, H-02 y H-03 |
| Dependencias (existen, necesarias, versión fijada, npm audit) | Parcial: solo herramientas de desarrollo, con versión exacta | `npm audit` pendiente de ejecutar (sección 4) |

## 2. Tabla de hallazgos

| Id | Archivo y línea | Problema | Categoría (OWASP o tipo) | Severidad | Corrección | Commit |
|---|---|---|---|---|---|---|
| H-01 | servicio-local/src/revisarArchivos.js:26-29 | Solo se excluía el nombre `.env` en minúsculas. Un archivo `.ENV` (el mismo archivo en Windows y macOS) no se excluía y sus claves con otros nombres, como `DB_URL=`, se enviaban a la IA | A01 Control de acceso defectuoso / fuga de secretos | Alta | El nombre se compara en minúsculas; prueba de abuso con `.ENV` y `.Env.Local` | 54668b0 |
| H-02 | revisarArchivos.js:7 | Los saltos de línea `\r` sueltos no se contaban: con `x\rPASSWORD=a\rAPI_KEY=b` se informaba una sola clave en la línea 1 | Posible error | Baja | Separador `/\r\n\|\r\|\n/` y prueba con líneas 2 y 3 | ec1969e |
| H-03 | revisarArchivos.js:15-19 y 54 | Los datos se leían dos veces (validar y revisar). Un objeto con `get contenido()` podía mostrar texto limpio al revisar y la clave después | Robustez de entradas / TOCTOU | Baja | `copiarArchivos` valida y copia leyendo cada dato una sola vez; prueba con un getter | dfc29d0 |

**Severidad:** alta (permite acceder o cambiar datos sin permiso, o expone secretos), media (error probable o riesgo con condiciones), baja (estilo o mantenibilidad).

Las pruebas de abuso se escribieron primero y se vieron fallar (3 en rojo) en el commit b32752a.

### Avisos del linter no corregidos

| Regla | Archivo y línea | Por qué se mantiene |
|---|---|---|
| Ninguno en la ejecución con reglas nativas | — | Los avisos del plugin `eslint-plugin-security` se anotarán aquí al ejecutarlo (ver sección 4) |

## 3. Revisión con IA

**Prompt usado:** «Eres revisor de seguridad de código. Lee solo este archivo (función que excluye `.env` y bloquea `API_KEY=`/`PASSWORD=`). Revisa inyección, secretos, contraseñas, control de acceso, dependencias y robustez ante entradas maliciosas. Responde con tabla Id, línea, problema, categoría, severidad y arreglo; separa los hallazgos seguros de las sospechas y comprueba cada uno con node.» Ver entrada 8 de `bitacora_ia.md`.

| Hallazgo de la IA | ¿Real o falso positivo? | Cómo lo verifiqué |
|---|---|---|
| H1: `.ENV` y variantes en mayúsculas no se excluyen | Real (se corrigió como H-01 del proyecto) | Ejecuté la función con `.ENV` y `DB_URL=...`: devolvía `permitido: true` |
| H4: saltos `\r` sueltos dan línea incorrecta | Real (H-02) | Ejecuté la función con `x\rAPI_KEY=1`: informaba línea 1 en vez de 2 |
| H5: getter que cambia entre lecturas | Real, de baja probabilidad (H-03) | Prueba con un getter que cuenta lecturas: leía 3 veces |
| H2: no detecta `API_KEY: abc`, JSON, `SECRET`, `TOKEN` | Real, pero ya conocido y fuera del contrato (RNF-02 solo pide `API_KEY=` y `PASSWORD=`) | Ya estaba como «Límite conocido» en el README; queda en pendientes |
| H3: `password=>x` y `// API_KEY=tu-clave` se bloquean | Real, pero falla hacia el lado seguro (bloquea de más) | Lo probé; no se corrige ahora para no ampliar el alcance |
| H6: un getter que lanza error rompe el `TypeError` del contrato | Real, impacto bajo | Se entiende por el código; queda en pendientes |
| H7: la ruta con un secreto dentro del nombre se devuelve igual | Real, muy poco probable | Queda en pendientes |
| H8: sin límite de tamaño de entrada | Real, impacto bajo (250 ms con 1 millón de claves) | Queda en pendientes; el límite lo debe poner quien llama |
| Sospecha S1: carpeta llamada `.env/` | Sin verificar; el contrato solo habla del nombre del archivo | Se anota como pendiente |
| «Expresión regular lenta (ReDoS)» | La IA lo descartó; lo confirmé | Con 200 000 espacios y con repeticiones tardó menos de 1 ms |

**Lo que la IA no encontró:** (a) `.env.example` es un archivo que se sube a git para mostrar qué variables existen, pero el `.gitignore` lo ignora (`.env.*`) y la función lo excluye del envío: una plantilla sin secretos se trata como secreto. Lo encontré yo al probar nombres; la IA no leyó `.gitignore` porque solo recibió el código. (b) Tampoco podía saber que el linter y `npm audit` no se ejecutaban en el entorno de trabajo.

## 4. Pendientes

| Pendiente | Por qué no se corrigió todavía | Plan |
|---|---|---|
| Ejecutar `npm install`, `npm run lint` y `npm audit` en el equipo del estudiante y anotar los resultados en este informe | El entorno del asistente no tenía acceso al registro de npm | Hacerlo antes de entregar; si el plugin avisa algo, corregirlo o justificarlo en la tabla de avisos |
| Detectar claves con `:` (JSON/YAML) y nombres como `SECRET`, `TOKEN` (H2) | Está fuera de HU-01 y de RNF-02 | Proponerlo como nueva historia de usuario |
| `.env.example`: dejar de ignorarlo en `.gitignore` y no excluirlo del envío | Hay que decidir con el cliente si una plantilla vacía se envía | Decidir en la próxima iteración |
| Arrojar `TypeError` también si leer un dato lanza otro error (H6) | Impacto bajo | Envolver la copia en `try/catch` |
| Falsos positivos por `=>` y comentarios (H3) | Fallan hacia el lado seguro | Ajustar la expresión regular con pruebas |
| Tope de tamaño de entrada (H8) y carpetas `.env/` (S1) | Los debe decidir quien llama a la función | Documentarlo en el diseño |

**Claves expuestas:** Ninguna. Se revisó todo el historial de git y no hay claves reales; los valores como `abc123` son ejemplos falsos de las pruebas.
