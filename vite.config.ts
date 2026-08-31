import { readFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const questionRoot = `${resolve(projectRoot, 'content/questions')}${sep}`;
const membershipRoot = `${resolve(projectRoot, 'content/profile-memberships')}${sep}`;
const resolvedMembershipPath = resolve(projectRoot, 'content/index/__generated-profile-memberships.json');

function isRuntimeContentJson(id: string): boolean {
  const cleanId = id.split('?')[0];
  return cleanId.startsWith(questionRoot)
    || cleanId.startsWith(membershipRoot)
    || cleanId === resolvedMembershipPath;
}

function runtimeJsonAssetPlugin() {
  return {
    name: 'kidsplay-runtime-json-assets',
    apply: 'build' as const,
    enforce: 'pre' as const,
    async load(id: string) {
      const cleanId = id.split('?')[0];
      if (!isRuntimeContentJson(cleanId)) return null;

      const source = await readFile(cleanId, 'utf8');
      const sourceLabel = relative(projectRoot, cleanId).split(sep).join('/');
      const referenceId = this.emitFile({
        type: 'asset',
        name: `runtime-${basename(cleanId)}`,
        source
      });

      return `
const assetUrl = import.meta.ROLLUP_FILE_URL_${referenceId};
const response = await fetch(assetUrl);
if (!response.ok) {
  throw new Error(${JSON.stringify('Kidsplay runtime content failed to load: ')} + ${JSON.stringify(sourceLabel)} + ' (' + response.status + ')');
}
const value = await response.json();
export default value;
`;
    }
  };
}

export default defineConfig({
  plugins: [runtimeJsonAssetPlugin(), svelte(), svelteTesting()],
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
