import { readFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const normalizePath = (value: string): string => value.replaceAll('\\', '/');
const questionRoot = `${normalizePath(resolve(projectRoot, 'content/questions'))}/`;
const membershipRoot = `${normalizePath(resolve(projectRoot, 'content/profile-memberships'))}/`;
const resolvedMembershipPath = normalizePath(resolve(projectRoot, 'content/index/__generated-profile-memberships.json'));
const firstPlayRuntimePath = normalizePath(resolve(projectRoot, 'content/runtime/first-play-production.json'));
const runtimeJsonPrefix = '\0kidsplay-runtime-json:';

function cleanModuleId(id: string): string {
  return normalizePath(id.split('?')[0]);
}

function isRuntimeContentJson(id: string): boolean {
  const cleanId = cleanModuleId(id);
  return cleanId.startsWith(questionRoot)
    || cleanId.startsWith(membershipRoot)
    || cleanId === resolvedMembershipPath
    || cleanId === firstPlayRuntimePath;
}

function runtimeJsonServeCompatPlugin(): Plugin {
  return {
    name: 'kidsplay-runtime-json-serve-compat',
    apply: 'serve',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.includes('runtime')) return null;
      const cleanSource = source.split('?')[0];
      const resolved = await this.resolve(cleanSource, importer, { skipSelf: true });
      if (!resolved || !isRuntimeContentJson(resolved.id)) return null;
      return cleanModuleId(resolved.id);
    }
  };
}

function runtimeJsonAssetPlugin(): Plugin {
  return {
    name: 'kidsplay-runtime-json-assets',
    apply: 'build',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (source.startsWith(runtimeJsonPrefix)) return source;

      const direct = cleanModuleId(source);
      if (isRuntimeContentJson(direct)) return `${runtimeJsonPrefix}${direct}`;

      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (!resolved || !isRuntimeContentJson(resolved.id)) return null;
      return `${runtimeJsonPrefix}${cleanModuleId(resolved.id)}`;
    },
    async load(id: string) {
      if (!id.startsWith(runtimeJsonPrefix)) return null;
      const cleanId = id.slice(runtimeJsonPrefix.length);

      const source = await readFile(cleanId, 'utf8');
      const sourceLabel = normalizePath(relative(projectRoot, cleanId));
      const referenceId: string = this.emitFile({
        type: 'asset',
        name: `runtime-${basename(cleanId)}`,
        source
      });

      return {
        moduleType: 'js',
        code: `
const assetUrl = import.meta.ROLLUP_FILE_URL_${referenceId};
const response = await fetch(assetUrl);
if (!response.ok) {
  throw new Error(${JSON.stringify('Kidsplay runtime content failed to load: ')} + ${JSON.stringify(sourceLabel)} + ' (' + response.status + ')');
}
const value = await response.json();
export default value;
`
      };
    }
  };
}

export default defineConfig({
  plugins: [runtimeJsonServeCompatPlugin(), runtimeJsonAssetPlugin(), svelte(), svelteTesting()],
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
