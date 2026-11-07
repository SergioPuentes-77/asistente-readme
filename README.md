# Asistente de documentación (README) para proyectos de clase

Asistente que genera con IA el README de proyectos de clase (instalación, módulos y ejemplos de uso).
Proyecto final del Seminario Inteligencia Artificial Aplicada al Ciclo de Vida del Software.

Según el diseño (ADR-001), el sistema se ejecuta en el equipo del desarrollador: interfaz web Angular y un
**servicio local en Node.js** con los datos en archivos JSON. El código del servicio está en `servicio-local/`.

```
servicio-local/
  src/    código de la funcionalidad
  test/   pruebas automatizadas (*.test.js)
bitacora_ia.md   registro del uso del asistente de código
```

## Funcionalidad de la semana 5

### Historia de usuario

**HU-01.** Como desarrollador, quiero que el sistema excluya los archivos con claves antes de enviar mi proyecto
a la IA, para no exponer mis datos secretos. Prioridad: Must. Necesidad de origen: N-03.

**Criterio de aceptación, escenario 1: archivo con clave.**
Dado que mi carpeta contiene un archivo «.env» con la línea «DB_PASSWORD=abc123», cuando cargo la carpeta,
entonces el sistema lo excluye del envío y muestra «Se excluyó 1 archivo con datos secretos».

**Criterio de aceptación, escenario 2 (error): clave en el código.**
Dado que el archivo «config.php» contiene la línea «API_KEY=XXXX-0000», cuando intento generar el README,
entonces el sistema bloquea el envío y muestra el nombre del archivo y el número de línea 1.

Esta funcionalidad también cumple RNF-02 (0 envíos de archivos con patrones como «API_KEY=» o «PASSWORD=»)
y la decisión del ADR-002 (filtrar en el servicio local, antes de enviar nada a la IA).

### Contrato de la función

Archivo: `servicio-local/src/revisarArchivos.js`

```js
/**
 * @typedef {{ ruta: string, contenido: string }} Archivo
 * @typedef {{ ruta: string, linea: number }} Bloqueo
 * @typedef {{
 *   permitido: boolean,      // true si se puede enviar el proyecto a la IA
 *   excluidos: string[],     // rutas de los archivos de claves que no se envían
 *   bloqueos: Bloqueo[],     // claves encontradas dentro del código (ruta y línea)
 *   mensaje: string          // aviso para el usuario sobre los archivos excluidos
 * }} ResultadoRevision
 *
 * @param {Archivo[]} archivos
 * @returns {ResultadoRevision}
 * @throws {TypeError} si `archivos` no es una lista o algún elemento no tiene ruta y contenido de texto
 */
function revisarArchivos(archivos) {}
```

**Qué recibe.** Una lista de archivos, cada uno con su `ruta` (con `/` o `\`) y su `contenido` en texto.

**Qué devuelve.** Un objeto con `permitido`, `excluidos`, `bloqueos` y `mensaje`.

**Reglas.**

1. **Archivo de claves:** si el nombre del archivo (el último tramo de la ruta) es exactamente `.env` o empieza
   con `.env.` (por ejemplo `.env.local`), se excluye y no se lee su contenido.
2. **Clave en el código:** en los demás archivos se revisa línea por línea. Una línea tiene una clave si contiene
   `API_KEY` o `PASSWORD` (en mayúsculas o minúsculas, también como `DB_PASSWORD`), seguido de `=` y un valor.
   Cada línea con clave agrega un bloqueo con la ruta y el número de línea (la primera línea es la 1).
3. **Permitido:** `permitido` es `true` solo si no hay bloqueos.
4. **Mensaje:** con 1 archivo excluido, «Se excluyó 1 archivo con datos secretos»; con N > 1,
   «Se excluyeron N archivos con datos secretos»; sin archivos excluidos, una cadena vacía.

**Supuestos.** El contenido llega como texto (los archivos binarios no se revisan). La función no lee el disco ni
llama a la IA; solo decide. Nunca devuelve ni guarda el valor de la clave, solo la ruta y la línea (ADR-002).

**Casos límite.**

- Lista vacía: `permitido: true`, sin excluidos ni bloqueos y mensaje vacío.
- Clave con valor vacío (`API_KEY=`): no cuenta como clave.
- Una comparación como `password == 'x'` no cuenta como clave.
- `.env` dentro de carpetas (`src/config/.env`) o con ruta de Windows (`src\.env`): se excluye.
- Un nombre que solo se parece a `.env` (por ejemplo `.environment.js`): no se excluye.
- Líneas con final `\r\n` (Windows) o `\n`: el número de línea es el mismo.
- Entrada inválida (`null`, no es lista, falta `ruta` o `contenido`): lanza `TypeError`.

**Ejemplos.**

| Entrada | Salida |
|---|---|
| `[{ ruta: '.env', contenido: 'DB_PASSWORD=abc123' }, { ruta: 'index.js', contenido: 'console.log(1);' }]` | `{ permitido: true, excluidos: ['.env'], bloqueos: [], mensaje: 'Se excluyó 1 archivo con datos secretos' }` |
| `[{ ruta: 'config.php', contenido: 'API_KEY=XXXX-0000' }]` | `{ permitido: false, excluidos: [], bloqueos: [{ ruta: 'config.php', linea: 1 }], mensaje: '' }` |
| `[]` | `{ permitido: true, excluidos: [], bloqueos: [], mensaje: '' }` |

### Cómo ejecutar las pruebas

Requisito: Node.js 18 o superior (no hay dependencias que instalar).

```
npm test
```
