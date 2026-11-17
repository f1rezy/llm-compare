import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default defineConfig([
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: fileURLToPath(new URL('./tsconfig.eslint.json', import.meta.url)),
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        },
    },
    {
        ignores: ['dist/', 'node_modules/', '*.config.js', 'eslint-plugin/'],
    },
]);
