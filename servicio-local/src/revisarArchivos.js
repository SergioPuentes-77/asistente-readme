// HU-01: excluir archivos con claves antes de enviar el proyecto a la IA.
// El contrato está en el README, sección «Funcionalidad de la semana 5».

const ARCHIVO_DE_CLAVES = '.env';
const PREFIJO_VARIANTE_DE_CLAVES = '.env.'; // por ejemplo .env.local
const SEPARADOR_DE_RUTA = /[\\/]/; // funciona con rutas de Linux y de Windows
const SEPARADOR_DE_LINEAS = /\r\n|\r|\n/; // Windows, Linux y Mac antiguo
// API_KEY o PASSWORD (cualquier mayúscula), un "=" que no sea "==" y un valor
const PATRON_DE_CLAVE = /(API_KEY|PASSWORD)\s*=(?!=)\s*\S+/i;

// Se lee cada dato una sola vez: lo que se revisa es lo que se envía (hallazgo H-03).
/**
 * Valida la lista de archivos y devuelve una copia simple.
 * @param {Array<{ruta: string, contenido: string}>} archivos lista que llega de quien llama
 * @returns {Array<{ruta: string, contenido: string}>} copia con los mismos datos, leídos una sola vez
 * @throws {TypeError} si no es una lista o si algún elemento no tiene ruta y contenido de texto
 */
function copiarArchivos(archivos) {
  if (!Array.isArray(archivos)) {
    throw new TypeError('archivos debe ser una lista de { ruta, contenido }');
  }
  return archivos.map((archivo) => {
    if (!archivo) {
      throw new TypeError('cada archivo debe tener ruta y contenido de texto');
    }
    const { ruta, contenido } = archivo;
    if (typeof ruta !== 'string' || typeof contenido !== 'string') {
      throw new TypeError('cada archivo debe tener ruta y contenido de texto');
    }
    return { ruta, contenido };
  });
}

/**
 * Obtiene el nombre del archivo, o sea el último tramo de la ruta.
 * @param {string} ruta ruta con "/" o "\\"
 * @returns {string} el nombre, por ejemplo "src/config/.env" devuelve ".env"
 */
function nombreDelArchivo(ruta) {
  return ruta.split(SEPARADOR_DE_RUTA).pop();
}

/**
 * Dice si un archivo es de claves: se llama .env o empieza con .env. (sin importar mayúsculas).
 * @param {string} ruta ruta del archivo
 * @returns {boolean} true si el archivo debe excluirse; ".environment.js" devuelve false
 */
function esArchivoDeClaves(ruta) {
  // En Windows y macOS ".ENV" es el mismo archivo que ".env", así que se compara en minúsculas
  const nombre = nombreDelArchivo(ruta).toLowerCase();
  return nombre === ARCHIVO_DE_CLAVES || nombre.startsWith(PREFIJO_VARIANTE_DE_CLAVES);
}

/**
 * Busca las líneas que contienen una clave del tipo API_KEY=valor o PASSWORD=valor.
 * @param {string} contenido texto del archivo (finales de línea \n, \r\n o \r)
 * @returns {number[]} números de línea, la primera es la 1; nunca incluye el valor de la clave
 */
function lineasConClave(contenido) {
  const numeros = [];
  contenido.split(SEPARADOR_DE_LINEAS).forEach((linea, indice) => {
    if (PATRON_DE_CLAVE.test(linea)) {
      numeros.push(indice + 1);
    }
  });
  return numeros;
}

/**
 * Arma el aviso para el usuario sobre los archivos excluidos.
 * @param {number} cantidad cuántos archivos se excluyeron
 * @returns {string} cadena vacía si es 0; singular si es 1; plural si es mayor
 */
function mensajeDeExcluidos(cantidad) {
  if (cantidad === 0) return '';
  if (cantidad === 1) return 'Se excluyó 1 archivo con datos secretos';
  return `Se excluyeron ${cantidad} archivos con datos secretos`;
}

/**
 * Decide si un proyecto puede enviarse a la IA (HU-01): excluye los archivos de claves
 * y bloquea el envío si el código contiene una clave. No lee el disco ni llama a la IA.
 * @param {Array<{ruta: string, contenido: string}>} archivos archivos del proyecto
 * @returns {{permitido: boolean, excluidos: string[], bloqueos: Array<{ruta: string, linea: number}>, mensaje: string}}
 *   permitido es true solo si no hay bloqueos; solo trae ruta y línea, nunca el valor de la clave
 * @throws {TypeError} si la entrada no es una lista de { ruta, contenido } con textos
 */
function revisarArchivos(archivos) {
  const excluidos = [];
  const bloqueos = [];

  for (const { ruta, contenido } of copiarArchivos(archivos)) {
    if (esArchivoDeClaves(ruta)) {
      excluidos.push(ruta);
      continue;
    }
    for (const linea of lineasConClave(contenido)) {
      bloqueos.push({ ruta, linea });
    }
  }

  return {
    permitido: bloqueos.length === 0,
    excluidos,
    bloqueos,
    mensaje: mensajeDeExcluidos(excluidos.length),
  };
}

module.exports = { revisarArchivos };
