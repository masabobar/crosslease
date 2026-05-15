import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/components/ui']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Catch leftover debug output
      'no-console': 'warn',
      // Always use === / !==
      eqeqeq: ['error', 'always'],
      // Prefer const where possible
      'prefer-const': 'error',
      // No var declarations
      'no-var': 'error',
      // Flag any usage without blocking it entirely
      '@typescript-eslint/no-explicit-any': 'error',
      // Enforce import type for type-only imports
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // Unused vars handled by TypeScript compiler — disable the JS rule to avoid duplicates
      'no-unused-vars': 'off',
    },
  },
])
