import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Les specs Playwright (e2e/) ne sont PAS des tests vitest : ils tournent via `npm run test:e2e`.
    // Sans cette exclusion, l'include par défaut de vitest les ramasse et la suite casse.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
