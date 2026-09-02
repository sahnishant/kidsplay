import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = 'src';
const capabilityAdapters = [
  'VisualEntity.svelte',
  'VisualRecipe.svelte',
  'SemanticAnimation.svelte',
  'VocabularySemanticScene.svelte'
] as const;

const allowedDirectImports = new Map<string, ReadonlySet<string>>([
  ['src/presentation/SemanticVisualPresenter.svelte', new Set(capabilityAdapters)],
  ['src/presentation/SemanticAnimation.svelte', new Set(['VisualEntity.svelte'])],
  ['src/presentation/VisualRecipe.svelte', new Set(['VisualEntity.svelte'])],
  ['src/presentation/VocabularySemanticScene.svelte', new Set(['VisualEntity.svelte'])]
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:svelte|ts)$/.test(name) ? [path.replaceAll('\\', '/')] : [];
  });
}

function importedCapabilityAdapters(source: string): string[] {
  return capabilityAdapters.filter((adapter) =>
    new RegExp(`from\\s+['\"][^'\"]*${adapter.replace('.', '\\.') }['\"]`).test(source)
  );
}

describe('semantic visual architecture boundaries', () => {
  it('allows lower-level visual capability imports only at the canonical adapter boundary', () => {
    const violations: string[] = [];

    for (const path of sourceFiles(root)) {
      const source = readFileSync(path, 'utf8');
      const imported = importedCapabilityAdapters(source);
      if (!imported.length) continue;

      const allowed = allowedDirectImports.get(path) ?? new Set<string>();
      for (const adapter of imported) {
        if (!allowed.has(adapter)) violations.push(`${relative('.', path)} -> ${adapter}`);
      }
    }

    expect(violations, 'direct capability imports must stay behind SemanticVisualPresenter').toEqual([]);
  });

  it('prevents product surfaces from bypassing the canonical item-presentation resolver', () => {
    const violations: string[] = [];
    for (const path of sourceFiles(root).filter((path) => path.startsWith('src/engines/') || path.startsWith('src/ui/'))) {
      const source = readFileSync(path, 'utf8');
      if (source.includes('resolveItemVisualRefs')) violations.push(path);
    }
    expect(violations, 'engines/UI must use resolveItemVisualPresentation instead of raw visual refs').toEqual([]);
  });

  it('keeps capability ownership explicit rather than growing another equivalent wrapper', () => {
    const presenter = readFileSync('src/presentation/SemanticVisualPresenter.svelte', 'utf8');
    for (const adapter of capabilityAdapters) expect(presenter).toContain(adapter);

    const scene = readFileSync('src/presentation/Scene.svelte', 'utf8');
    const meaning = readFileSync('src/presentation/VisualMeaningPresenter.svelte', 'utf8');
    expect(scene).toContain('SemanticVisualPresenter');
    expect(meaning).toContain('SemanticVisualPresenter');
    for (const adapter of capabilityAdapters) {
      expect(scene).not.toContain(`from './${adapter}'`);
      expect(meaning).not.toContain(`from './${adapter}'`);
    }
  });
});
