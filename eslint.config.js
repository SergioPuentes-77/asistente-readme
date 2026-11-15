// Configuración de ESLint 9 (formato "flat config") con reglas de seguridad.
// Se ejecuta con: npm run lint
const js = require('@eslint/js');
const security = require('eslint-plugin-security');

module.exports = [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', process: 'readonly', console: 'readonly' },
    },
    rules: {
      // Reglas propias de seguridad (además de las del plugin)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
];
