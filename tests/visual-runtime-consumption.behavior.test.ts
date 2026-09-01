import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Question } from '../src/contracts/question';
import { resolveQuestionFeedbackRecipeId } from '../src/presentation/questionFeedbackVisual';

function choiceQuestion(
  correctOptionIds: string[],
  options: Array<{ id: string; label: string; semanticRef?: string }>
): Question {
  return {
    id: 'test.visual-consumption',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.visual-consumption'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Choose.' },
    feedback: { correct: 'Correct.', incorrect: 'Review the idea.' },
    authoring: { status: 'reviewed', source: 'test' },
    interaction: { type: 'single_choice', version: 1, options },
    solution: { type: 'exact_option', correctOptionIds }
  };
}

describe('consolidated visual runtime consumption', () => {
  it('resolves exactly one authored correct semantic recipe for post-answer teaching', () => {
    const question = choiceQuestion(['temperature'], [
      { id: 'temperature', label: 'Temperature', semanticRef: 'temperature' },
      { id: 'other', label: 'Other' }
    ]);

    expect(resolveQuestionFeedbackRecipeId(question)).toBe('recipe.measurement.temperature');
  });

  it('resolves the concurrent soil family through the same live post-answer path', () => {
    const question = choiceQuestion(['sandy-soil'], [
      { id: 'sandy-soil', label: 'Sandy soil', semanticRef: 'sandy-soil' },
      { id: 'other', label: 'Other' }
    ]);

    expect(resolveQuestionFeedbackRecipeId(question)).toBe('recipe.soil.sandy');
  });

  it('fails closed when a solution would imply more than one feedback recipe', () => {
    const question = choiceQuestion(['transparent', 'opaque'], [
      { id: 'transparent', label: 'Transparent', semanticRef: 'transparent' },
      { id: 'opaque', label: 'Opaque', semanticRef: 'opaque' }
    ]);

    expect(resolveQuestionFeedbackRecipeId(question)).toBeNull();
  });

  it('keeps both high-level presenters on the live post-answer session path', () => {
    const session = readFileSync('src/ui/SessionViewport.svelte', 'utf8');
    expect(session).toContain("import VisualMeaningPresenter from '../presentation/VisualMeaningPresenter.svelte'");
    expect(session).toContain("import VisualRecipe from '../presentation/VisualRecipe.svelte'");
    expect(session).toContain('sessionState.submitted && !reinforcementSceneId');
    expect(session).toContain('<VisualMeaningPresenter');
    expect(session).toContain('<VisualRecipe');
    expect(session.indexOf('sessionState.submitted')).toBeGreaterThan(-1);
  });

  it('keeps recipe resolution consumed by existing interactive engines', () => {
    for (const path of [
      'src/engines/SingleChoice.svelte',
      'src/engines/MemoryPairs.svelte',
      'src/engines/WordBankFill.svelte'
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('resolveItemVisualRefs');
      expect(source).toContain('VisualEntity');
    }
  });

  it('keeps semantic scenes and all new primitive families reachable from live renderers', () => {
    const scene = readFileSync('src/presentation/Scene.svelte', 'utf8');
    const entity = readFileSync('src/presentation/VisualEntity.svelte', 'utf8');

    expect(scene).toContain("import SemanticAnimation from './SemanticAnimation.svelte'");
    expect(scene).toContain("import VocabularySemanticScene from './VocabularySemanticScene.svelte'");
    expect(entity).toContain("import MeasurementIcon from './MeasurementIcon.svelte'");
    expect(entity).toContain("import MaterialPropertyIcon from './MaterialPropertyIcon.svelte'");
    expect(entity).toContain("import EnvironmentalActionIcon from './EnvironmentalActionIcon.svelte'");
    expect(entity).toContain("import SoilTypeIcon from './SoilTypeIcon.svelte'");
  });

  it('keeps the previously unconsumed curious-dog composition on a real child question path', () => {
    const scenes = readFileSync('content/scenes/animals.json', 'utf8');
    const questions = readFileSync('content/questions/animals.json', 'utf8');
    expect(scenes).toContain('"scene.dog.curious-bone"');
    expect(scenes).toContain('"animation.dog.curious-bone"');
    expect(questions).toContain('"stimulus": { "type": "scene", "sceneId": "scene.dog.curious-bone" }');
    expect(questions).toContain('"stimulus": { "type": "scene", "sceneId": "scene.dog.happy-bone" }');
  });
});
