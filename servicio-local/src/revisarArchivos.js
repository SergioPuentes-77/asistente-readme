// HU-01: excluir archivos con claves antes de enviar el proyecto a la IA.
// El contrato está en el README, sección «Funcionalidad de la semana 5».

const ARCHIVO_DE_CLAVES = '.env';
const PREFIJO_VARIANTE_DE_CLAVES = '.env.'; // por ejemplo .env.local
const SEPARADOR_DE_RUTA = /[\\/]/; // funciona con rutas de Linux y de Windows
const SEPARADOR_DE_LINEAS = /\r\n|\r|\n/; // Windows, Linux y Mac antiguo
// API_KEY o PASSWORD (cualquier mayúscula), un "=" que no sea "==" y un valor
const PATRON_DE_CLAVE = /(API_KEY|PASSWORD)\s*=(?!=)\s*\S+/i;

function validarArchivos(archivos) {
  if (!Array.isArray(archivos)) {
    throw new TypeError('archivos debe ser una lista de { ruta, contenido }');
  }
  for (const archivo of archivos) {
    if (!archivo || typeof archivo.ruta !== 'string' || typeof archivo.contenido !== 'string') {
      throw new TypeError('cada archivo debe tener ruta y contenido de texto');
    }
  }
}

function nombreDelArchivo(ruta) {
  return ruta.split(SEPARADOR_DE_RUTA).pop();
}

function esArchivoDeClaves(ruta) {
  // En Windows y macOS ".ENV" es el mismo archivo que ".env", así que se compara en minúsculas
  const nombre = nombreDelArchivo(ruta).toLowerCase();
  return nombre === ARCHIVO_DE_CLAVES || nombre.startsWith(PREFIJO_VARIANTE_DE_CLAVES);
}

// Devuelve los números de línea (desde 1) que contienen una clave.
function lineasConClave(contenido) {
  const numeros = [];
  contenido.split(SEPARADOR_DE_LINEAS).forEach((linea, indice) => {
    if (PATRON_DE_CLAVE.test(linea)) {
      numeros.push(indice + 1);
    }
  });
  return numeros;
}

function mensajeDeExcluidos(cantidad) {
  if (cantidad === 0) return '';
  if (cantidad === 1) return 'Se excluyó 1 archivo con datos secretos';
  return `Se excluyeron ${cantidad} archivos con datos secretos`;
}

function revisarArchivos(archivos) {
  validarArchivos(archivos);

  const excluidos = [];
  const bloqueos = [];

  for (const { ruta, contenido } of archivos) {
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
