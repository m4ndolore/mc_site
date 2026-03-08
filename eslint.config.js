import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'eqeqeq': ['warn', 'smart'],
    },
  },
  {
    files: ['scripts/**'],
    rules: {
      'no-useless-assignment': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'cloudflare/**/node_modules/**',
      'public/**',
      '*.min.js',
    ],
  },
]
