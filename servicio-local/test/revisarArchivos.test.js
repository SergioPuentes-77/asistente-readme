// Pruebas de HU-01: excluir archivos con claves antes de enviar el proyecto a la IA.
// Se escribieron antes que el código, a partir del contrato del README.
const test = require('node:test');
const assert = require('node:assert/strict');
const { revisarArchivos } = require('../src/revisarArchivos');

// ---------- Casos normales ----------

test('excluye el archivo .env y avisa que se excluyó 1 archivo (HU-01, escenario 1)', () => {
  const resultado = revisarArchivos([
    { ruta: '.env', contenido: 'DB_PASSWORD=abc123' },
    { ruta: 'index.js', contenido: "console.log('hola');" },
  ]);
  assert.deepEqual(resultado, {
    permitido: true,
    excluidos: ['.env'],
    bloqueos: [],
    mensaje: 'Se excluyó 1 archivo con datos secretos',
  });
});

test('usa el plural cuando se excluyen 2 archivos de claves', () => {
  const resultado = revisarArchivos([
    { ruta: '.env', contenido: 'JWT_SECRET=uno' },
    { ruta: 'api/.env.local', contenido: 'DB_PASSWORD=dos' },
  ]);
  assert.deepEqual(resultado.excluidos, ['.env', 'api/.env.local']);
  assert.equal(resultado.mensaje, 'Se excluyeron 2 archivos con datos secretos');
  assert.equal(resultado.permitido, true);
});

test('permite un proyecto sin claves y no muestra mensaje', () => {
  const resultado = revisarArchivos([
    { ruta: 'README.md', contenido: '# Proyecto' },
    { ruta: 'app.js', contenido: 'const a = 1;' },
  ]);
  assert.deepEqual(resultado, { permitido: true, excluidos: [], bloqueos: [], mensaje: '' });
});

test('no distingue mayúsculas de minúsculas en el nombre de la clave', () => {
  const resultado = revisarArchivos([{ ruta: 'db.js', contenido: 'db_password=abc' }]);
  assert.equal(resultado.permitido, false);
  assert.deepEqual(resultado.bloqueos, [{ ruta: 'db.js', linea: 1 }]);
});

// ---------- Casos de error (escenario 2 del criterio de aceptación) ----------

test('bloquea el envío si el código contiene una clave y dice archivo y línea 1 (HU-01, escenario 2)', () => {
  const resultado = revisarArchivos([{ ruta: 'config.php', contenido: 'API_KEY=XXXX-0000' }]);
  assert.deepEqual(resultado, {
    permitido: false,
    excluidos: [],
    bloqueos: [{ ruta: 'config.php', linea: 1 }],
    mensaje: '',
  });
});

test('lanza TypeError si los datos de entrada no son válidos', () => {
  assert.throws(() => revisarArchivos(null), TypeError);
  assert.throws(() => revisarArchivos('config.php'), TypeError);
  assert.throws(() => revisarArchivos([{ ruta: 'a.js' }]), TypeError);
});

// ---------- Casos límite ----------

test('una lista vacía se permite sin excluidos ni bloqueos', () => {
  assert.deepEqual(revisarArchivos([]), {
    permitido: true,
    excluidos: [],
    bloqueos: [],
    mensaje: '',
  });
});

test('reporta las líneas de la primera y la última clave, también con finales de línea de Windows', () => {
  const contenido = 'API_KEY=1\r\nconst a = 2;\r\nPASSWORD=3';
  const resultado = revisarArchivos([{ ruta: 'app.js', contenido }]);
  assert.deepEqual(resultado.bloqueos, [
    { ruta: 'app.js', linea: 1 },
    { ruta: 'app.js', linea: 3 },
  ]);
});

test('reconoce .env dentro de carpetas y con rutas de Windows', () => {
  const resultado = revisarArchivos([
    { ruta: 'src/config/.env', contenido: 'API_KEY=1' },
    { ruta: 'src\\.env', contenido: 'API_KEY=2' },
  ]);
  assert.deepEqual(resultado.excluidos, ['src/config/.env', 'src\\.env']);
  assert.equal(resultado.permitido, true);
});

test('una clave con valor vacío no cuenta como clave', () => {
  const resultado = revisarArchivos([{ ruta: 'ejemplo.txt', contenido: 'API_KEY=' }]);
  assert.equal(resultado.permitido, true);
  assert.deepEqual(resultado.bloqueos, []);
});

test('un nombre parecido a .env, como .environment.js, no se excluye', () => {
  const resultado = revisarArchivos([{ ruta: '.environment.js', contenido: 'const a = 1;' }]);
  assert.deepEqual(resultado.excluidos, []);
  assert.equal(resultado.mensaje, '');
});

test("una comparación como password == 'x' no cuenta como clave", () => {
  const resultado = revisarArchivos([{ ruta: 'login.js', contenido: "if (password == 'x') {}" }]);
  assert.equal(resultado.permitido, true);
  assert.deepEqual(resultado.bloqueos, []);
});
