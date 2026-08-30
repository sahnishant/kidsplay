import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  base: './',
  server: {
    port: 5180,
    strictPort: true
  },
  build: {
    target: 'es2022'
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    isolate: false,
    clearMocks: true,
    restoreMocks: true
  }
});
