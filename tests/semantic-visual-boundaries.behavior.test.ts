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
const primitiveRenderers = [
  'SceneIcon.svelte',
  'EntityIcon.svelte',
  'UtilityIcon.svelte',
  'NatureSpaceIcon.svelte',
  'EverydayIcon.svelte',
  'ProcessIcon.svelte',
  'MeasurementIcon.svelte',
  'MaterialPropertyIcon.svelte',
  'EnvironmentalActionIcon.svelte',
  'SoilTypeIcon.svelte',
  'AnimalExpansionIcon.svelte',
  'ConceptIcon.svelte',
  'CurriculumIcon.svelte',
  'LearningIcon.svelte',
  'PropertyIcon.svelte',
  'Class2ConceptIcon.svelte',
  'Class2FinalIcon.svelte'
] as const;
const restrictedVisualModules = [...capabilityAdapters, ...primitiveRenderers] as const;

const allowedDirectImports = new Map<string, ReadonlySet<string>>([
  ['src/presentation/SemanticVisualPresenter.svelte', new Set(capabilityAdapters)],
  ['src/presentation/SemanticAnimation.svelte', new Set(['VisualEntity.svelte'])],
  ['src/presentation/VisualRecipe.svelte', new Set(['VisualEntity.svelte'])],
  ['src/presentation/VocabularySemanticScene.svelte', new Set(['VisualEntity.svelte'])],
  ['src/presentation/VisualEntity.svelte', new Set(primitiveRenderers)]
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:svelte|ts)$/.test(name) ? [path.replaceAll('\\', '/')] : [];
  });
}

function importedRestrictedModules(source: string): string[] {
  return restrictedVisualModules.filter((moduleName) =>
    new RegExp(`from\\s+['\"][^'\"]*${moduleName.replace('.', '\\.') }['\"]`).test(source)
  );
}

describe('semantic visual architecture boundaries', () => {
  it('allows visual capability/primitive imports only at their canonical adapter boundaries', () => {
    const violations: string[] = [];

    for (const path of sourceFiles(root)) {
      const source = readFileSync(path, 'utf8');
      const imported = importedRestrictedModules(source);
      if (!imported.length) continue;

      const allowed = allowedDirectImports.get(path) ?? new Set<string>();
      for (const moduleName of imported) {
        if (!allowed.has(moduleName)) violations.push(`${relative('.', path)} -> ${moduleName}`);
      }
    }

    expect(violations, 'visual imports must stay behind SemanticVisualPresenter/VisualEntity boundaries').toEqual([]);
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

    const entity = readFileSync('src/presentation/VisualEntity.svelte', 'utf8');
    for (const primitive of primitiveRenderers) expect(entity).toContain(primitive);

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
