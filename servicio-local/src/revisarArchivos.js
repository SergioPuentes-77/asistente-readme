// HU-01: excluir archivos con claves antes de enviar el proyecto a la IA.
// El contrato está en el README, sección «Funcionalidad de la semana 5».

function revisarArchivos(archivos) {
  if (!Array.isArray(archivos)) {
    throw new TypeError('archivos debe ser una lista de { ruta, contenido }');
  }

  const excluidos = [];
  const bloqueos = [];

  for (const archivo of archivos) {
    if (!archivo || typeof archivo.ruta !== 'string' || typeof archivo.contenido !== 'string') {
      throw new TypeError('cada archivo debe tener ruta y contenido de texto');
    }

    const nombre = archivo.ruta.split(/[\\/]/).pop();
    if (nombre === '.env' || nombre.startsWith('.env.')) {
      excluidos.push(archivo.ruta);
      continue;
    }

    const lineas = archivo.contenido.split(/\r?\n/);
    for (let i = 0; i < lineas.length; i++) {
      if (/(API_KEY|PASSWORD)\s*=(?!=)\s*\S+/i.test(lineas[i])) {
        bloqueos.push({ ruta: archivo.ruta, linea: i + 1 });
      }
    }
  }

  let mensaje = '';
  if (excluidos.length === 1) {
    mensaje = 'Se excluyó 1 archivo con datos secretos';
  } else if (excluidos.length > 1) {
    mensaje = 'Se excluyeron ' + excluidos.length + ' archivos con datos secretos';
  }

  return { permitido: bloqueos.length === 0, excluidos, bloqueos, mensaje };
}

module.exports = { revisarArchivos };
