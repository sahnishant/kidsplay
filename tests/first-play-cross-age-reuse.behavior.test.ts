import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { EARTH_LEARN_ABOUT_TOPIC } from '../src/experience/learnAboutCatalog';
import { validateFirstPlayRecipePolicy } from '../src/experience/firstPlayPolicy';

describe('First Play canonical cross-age reuse', () => {
  it('uses the same reviewed Earth row in First Play and deeper Learn About instead of copying truth', () => {
    validateFirstPlayRecipePolicy({
      stage: 'fp4_concrete_concept',
      evidenceClass: 'guided_practice',
      readingRequired: false,
      instructionSteps: 1,
      initialChoiceCount: 2,
      primaryTargetScale: 'oversized',
      wrongActionRecovery: 'in_place',
      requiresSeparateSubmitAfterCommittedAction: false,
      action: 'find'
    });

    const firstPlayQuestion: SingleChoiceQuestion = {
      id: 'first-play.earth.planet',
      revision: 1,
      schemaVersion: 1,
      conceptIds: ['universe.earth.planet'],
      knowledgeRefs: ['kr.universe.earth.type.planet'],
      difficulty: 1,
      language: 'en',
      prompt: { text: 'Find Earth' },
      feedback: { correct: 'Yes!', incorrect: 'Try again' },
      authoring: { status: 'reviewed', source: 'canonical-ref-reuse-proof' },
      interaction: {
        type: 'single_choice',
        version: 1,
        shuffleOptions: true,
        options: [
          { id: 'earth', label: 'Earth', semanticRef: 'earth' },
          { id: 'sun', label: 'Sun', semanticRef: 'sun' }
        ]
      },
      solution: { type: 'exact_option', correctOptionIds: ['earth'] }
    };

    const olderChildRefs = EARTH_LEARN_ABOUT_TOPIC.sections
      .filter((section) => section.depthBands.some((band) => band === 'd2_early_primary' || band === 'd3_deeper_primary'))
      .flatMap((section) => section.knowledgeRefs);
    const firstPlayRef = firstPlayQuestion.knowledgeRefs[0];

    expect(firstPlayRef).toBe('kr.universe.earth.type.planet');
    expect(olderChildRefs).toContain(firstPlayRef);
    expect(new Set([...firstPlayQuestion.knowledgeRefs, ...olderChildRefs]).size).toBeGreaterThan(1);
  });
});
