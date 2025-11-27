import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        File: 'readonly',
        URL: 'readonly',
        Event: 'readonly',
        DragEvent: 'readonly',
        MouseEvent: 'readonly',
        HTMLInputElement: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'prettier/prettier': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'log', 'info'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    // Allow 'any' types in test files and test setup files where it's often necessary for mocks/stubs
    files: ['**/__tests__/**/*.{ts,tsx,vue}', '**/*.{spec,test}.{ts,tsx,vue}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'vendor/**',
      'public/**',
      'storage/**',
      'bootstrap/cache/**',
      'dist/**',
    ],
  },
];
