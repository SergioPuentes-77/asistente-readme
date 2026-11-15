// Pruebas de abuso (semana 6): entradas hechas para saltarse el filtro de claves.
// Cada prueba corresponde a un hallazgo de revision_seguridad.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { revisarArchivos } = require('../src/revisarArchivos');

// H-01: en Windows y macOS ".ENV" es el mismo archivo que ".env"
test('abuso: un archivo .ENV en mayúsculas también se excluye', () => {
  const resultado = revisarArchivos([
    { ruta: '.ENV', contenido: 'DB_URL=postgres://usuario:clave@host/db' },
    { ruta: 'config/.Env.Local', contenido: 'JWT_SECRET=uno' },
  ]);
  assert.deepEqual(resultado.excluidos, ['.ENV', 'config/.Env.Local']);
  assert.equal(resultado.permitido, true);
});

test('abuso: .environment.js sigue sin excluirse aunque esté en mayúsculas', () => {
  const resultado = revisarArchivos([{ ruta: '.ENVIRONMENT.js', contenido: 'const a = 1;' }]);
  assert.deepEqual(resultado.excluidos, []);
});

// H-02: archivos con saltos de línea "\r" sueltos (formato antiguo de Mac)
test('abuso: el número de línea es correcto con saltos de línea \\r sueltos', () => {
  const resultado = revisarArchivos([{ ruta: 'a.js', contenido: 'x = 1\rPASSWORD=abc\rAPI_KEY=def' }]);
  assert.deepEqual(resultado.bloqueos, [
    { ruta: 'a.js', linea: 2 },
    { ruta: 'a.js', linea: 3 },
  ]);
});

// H-03: un objeto que cambia su contenido entre la validación y la revisión
test('abuso: se revisa una sola copia de los datos aunque el objeto cambie al leerlo', () => {
  let lecturas = 0;
  const archivo = {
    ruta: 'trampa.js',
    get contenido() {
      lecturas += 1;
      return lecturas <= 2 ? 'const a = 1;' : 'API_KEY=secreto';
    },
  };
  const resultado = revisarArchivos([archivo]);
  // Se lee el contenido una sola vez; lo que se revisó es lo mismo que se envía
  assert.equal(lecturas, 1);
  assert.equal(resultado.permitido, true);
});
