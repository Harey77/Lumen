import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', '**/*.tmp.cjs', '**/*.tmp.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Offline and privacy promise: app code never calls the network (Tech Stack section 3).
      'no-restricted-globals': ['error',
        { name: 'fetch', message: 'Lumen makes no network calls. See AGENTS.md.' },
        { name: 'XMLHttpRequest', message: 'Lumen makes no network calls.' },
        { name: 'WebSocket', message: 'Lumen makes no network calls.' },
        { name: 'EventSource', message: 'Lumen makes no network calls.' },
      ],
      'no-restricted-properties': ['error',
        { object: 'navigator', property: 'sendBeacon', message: 'Lumen makes no network calls.' },
        { object: 'window', property: 'fetch', message: 'Lumen makes no network calls.' },
      ],
    },
  },
  {
    // The tutor client is the single place allowed to call the network (Lumen's own /api).
    files: ['src/tutor/api.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: [{ name: '@anthropic-ai/sdk', message: 'Provider SDKs are server-only. Use src/tutor/api.ts.' }] }] },
  },
  { files: ['e2e/**/*.ts', '*.config.ts', 'server/**/*.ts'], languageOptions: { globals: globals.node } },
)
