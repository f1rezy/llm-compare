import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        ignores: ['dist', 'node_modules', 'eslint.config.js'],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        extends: [tseslint.configs.recommended],
    },
    prettierConfig,
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
    {
        files: ['**/*.test.ts'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
]);
