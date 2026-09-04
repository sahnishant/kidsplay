import { describe, expect, it } from 'vitest';
import { EARTH_LEARN_ABOUT_TOPIC } from '../src/experience/learnAboutCatalog';
import {
  FIRST_PLAY_ACTIVITIES,
  VISUAL_REASONING_ACTIVITIES,
  evaluateFirstPlayQuestion,
  resolveFirstPlayMicroReaction,
  validateFirstPlayProductionActivity
} from '../src/experience/firstPlayProduction';
import { resolveVisualDefinition } from '../src/presentation/visualRegistry';
import { getStoryCharacterPersona } from '../src/story/storyPersona';

describe('First Play production sampler', () => {
  it('ships the complete bounded sampler with the required child interaction mix', () => {
    expect(FIRST_PLAY_ACTIVITIES).toHaveLength(9);
    expect(FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'touch_discover')).toHaveLength(2);
    expect(FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'listen_find')).toHaveLength(2);
    expect(FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'place_match')).toHaveLength(2);
    expect(FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'semantic_contrast')).toHaveLength(1);
    expect(FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'letter_picture')).toHaveLength(1);
    expect(FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'cause_effect')).toHaveLength(1);

    for (const activity of FIRST_PLAY_ACTIVITIES) {
      expect(() => validateFirstPlayProductionActivity(activity)).not.toThrow();
    }
  });

  it('keeps Touch & Discover and cause/effect explicitly exploratory', () => {
    const exploration = FIRST_PLAY_ACTIVITIES.filter(
      (activity) => activity.kind === 'touch_discover' || activity.kind === 'cause_effect'
    );
    expect(exploration).toHaveLength(3);
    expect(exploration.every((activity) => activity.evidenceClass === 'exploration')).toBe(true);
  });

  it('runs guided First Play through the canonical evaluator but strips mastery evidence', () => {
    const earth = FIRST_PLAY_ACTIVITIES.find(
      (activity) => activity.id === 'first-play.listen.earth' && activity.kind === 'listen_find'
    );
    if (!earth || earth.kind !== 'listen_find') throw new Error('Earth Listen & Find activity missing');

    const correct = evaluateFirstPlayQuestion(earth, { selectedOptionIds: ['earth'] });
    expect(correct.result.correct).toBe(true);
    expect(correct.feedback).toBe('celebrate');
    expect(correct.result.masteryEvidence).toEqual([]);
    expect(correct.result.knowledgeEvidence).toEqual([]);

    const wrong = evaluateFirstPlayQuestion(earth, { selectedOptionIds: ['sun'] });
    expect(wrong.result.correct).toBe(false);
    expect(wrong.feedback).toBe('retry_in_place');
    expect(wrong.result.masteryEvidence).toEqual([]);
    expect(wrong.result.knowledgeEvidence).toEqual([]);
  });

  it('uses two choices, hidden reading labels and materially forgiving placement tolerance', () => {
    const twoChoice = FIRST_PLAY_ACTIVITIES.filter(
      (activity) => activity.kind === 'listen_find' || activity.kind === 'letter_picture'
    );
    for (const activity of twoChoice) {
      if (activity.kind !== 'listen_find' && activity.kind !== 'letter_picture') continue;
      expect(activity.question.interaction.options).toHaveLength(2);
      expect(activity.question.interaction.shuffleOptions).toBe(true);
      expect(activity.question.interaction.presentation).toEqual({
        mode: 'visual_dominant',
        tier: 'first_play',
        labels: 'hidden'
      });
    }

    const placing = FIRST_PLAY_ACTIVITIES.filter((activity) => activity.kind === 'place_match');
    for (const activity of placing) {
      if (activity.kind !== 'place_match') continue;
      expect(activity.question.interaction.items).toHaveLength(1);
      expect(activity.question.interaction.targets).toHaveLength(2);
      expect(activity.dropSnapTolerancePx).toBeGreaterThanOrEqual(40);
    }
  });

  it('includes the required A -> Apple letter-name exposure without inventing phoneme authority', () => {
    const activity = FIRST_PLAY_ACTIVITIES.find((candidate) => candidate.kind === 'letter_picture');
    if (!activity || activity.kind !== 'letter_picture') throw new Error('Letter-picture First Play activity missing');

    expect(activity.stage).toBe('fp5_sound_letter_exposure');
    expect(activity.evidenceClass).toBe('guided_practice');
    expect(activity.grapheme).toBe('A');
    expect(activity.targetWord).toBe('Apple');
    expect(activity.associationKind).toBe('letter_name_to_word_initial');
    expect(activity.promptText).toBe('A ... Apple');
    expect(activity.question.interaction.options.map((option) => option.label).sort()).toEqual(['Apple', 'Orange']);
    expect(activity.question.knowledgeRefs).toEqual([]);

    const correct = evaluateFirstPlayQuestion(activity, { selectedOptionIds: ['apple'] });
    const wrong = evaluateFirstPlayQuestion(activity, { selectedOptionIds: ['orange'] });
    expect(correct.result.correct).toBe(true);
    expect(correct.result.masteryEvidence).toEqual([]);
    expect(correct.result.knowledgeEvidence).toEqual([]);
    expect(wrong.result.correct).toBe(false);
    expect(wrong.feedback).toBe('retry_in_place');
  });

  it('teaches full/empty and cause/effect as visible state changes rather than definition MCQs', () => {
    const contrast = FIRST_PLAY_ACTIVITIES.find((activity) => activity.kind === 'semantic_contrast');
    const change = FIRST_PLAY_ACTIVITIES.find((activity) => activity.kind === 'cause_effect');
    if (!contrast || contrast.kind !== 'semantic_contrast') throw new Error('Full/empty contrast missing');
    if (!change || change.kind !== 'cause_effect') throw new Error('Cause/effect activity missing');

    expect(new Set(contrast.states.map((state) => state.state))).toEqual(new Set(['full', 'empty']));
    expect(contrast.comparisonDimensionRef).toBe('kr.vocab.state.full.contrasts-with-empty');
    expect(change.beforeState).toBe('empty');
    expect(change.afterState).toBe('full');
    expect(change.action.stateTransition).toEqual({
      beforeStateRef: 'semantic.container.empty',
      afterStateRef: 'semantic.container.full',
      causalKnowledgeRef: 'kr.vocab.state.full.describes-container-content'
    });
  });

  it('consumes the merged persona vocabulary through an event grammar instead of per-question scripts', () => {
    const reactions = [
      resolveFirstPlayMicroReaction('discover'),
      resolveFirstPlayMicroReaction('mischief'),
      resolveFirstPlayMicroReaction('scaffold')
    ];
    expect(reactions.map((reaction) => reaction.character)).toEqual(['dheu', 'shaitanu', 'scientu']);

    for (const reaction of reactions) {
      const persona = getStoryCharacterPersona(reaction.character);
      expect(persona.speech.signatures.some((signature) => reaction.text.startsWith(signature))).toBe(true);
    }
  });

  it('reuses the reviewed Earth row in both First Play and an older-child Learn About projection', () => {
    const earth = FIRST_PLAY_ACTIVITIES.find(
      (activity) => activity.id === 'first-play.listen.earth' && activity.kind === 'listen_find'
    );
    if (!earth || earth.kind !== 'listen_find') throw new Error('Earth Listen & Find activity missing');
    const rowRef = earth.question.knowledgeRefs?.[0];
    const olderRefs = EARTH_LEARN_ABOUT_TOPIC.sections.flatMap((section) => section.knowledgeRefs);

    expect(rowRef).toBe('kr.universe.earth.type.planet');
    expect(olderRefs).toContain(rowRef);
  });

  it('resolves every explicit production visual ref through the bundled visual registry', () => {
    const items = FIRST_PLAY_ACTIVITIES.flatMap((activity) => {
      if (activity.kind === 'touch_discover') return [activity.item];
      if (activity.kind === 'listen_find' || activity.kind === 'letter_picture' || activity.kind === 'semantic_contrast') return activity.question.interaction.options;
      if (activity.kind === 'place_match') return [...activity.question.interaction.items, ...activity.question.interaction.targets];
      return [];
    });
    for (const activity of VISUAL_REASONING_ACTIVITIES) items.push(...activity.question.interaction.options);

    const refs = new Set(items.flatMap((item) => item.visualRefs ?? []));
    expect(refs.size).toBeGreaterThan(20);
    for (const ref of refs) expect(resolveVisualDefinition(ref), ref).not.toBeNull();
  });
});
