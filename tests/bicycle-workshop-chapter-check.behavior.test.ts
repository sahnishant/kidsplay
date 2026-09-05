import { describe, expect, it } from 'vitest';
import { createSessionForCatalogEntry, getCatalogEntries, getFreePackQuestions } from '../src/content';
import { evaluate } from '../src/evaluation/evaluate';

const packId = 'free.english.bicycle-workshop.chapter-check.1';
const expectedIds = new Set([
  'bicycle.workshop.reading.detail.001',
  'bicycle.workshop.reading.sequence.001',
  'bicycle.workshop.word.pedal-noun.001',
  'bicycle.workshop.phonics.short-a.001',
  'bicycle.workshop.grammar.article.002',
  'bicycle.workshop.match.parts-functions.001',
  'bicycle.workshop.sequence.motion.001',
  'bicycle.workshop.safety.pre-ride.001'
]);

describe('Bicycle Workshop chapter check', () => {
  it('is a visible, bounded and non-official Class 2 assessment companion', () => {
    expect(getCatalogEntries().find((entry) => entry.id === packId)).toMatchObject({
      id: packId,
      kind: 'free_explore',
      title: 'Bicycle Workshop — Chapter Check',
      access: { type: 'free' },
      status: 'ready',
      actionLabel: 'Take chapter check'
    });

    const bank = getFreePackQuestions(packId);
    expect(bank).toHaveLength(8);
    expect(new Set(bank.map((question) => question.id))).toEqual(expectedIds);
  });

  it('launches every admitted check item through the existing session selector', () => {
    const launch = createSessionForCatalogEntry(packId);
    expect(launch.mode).toBe('free_explore');
    expect(launch.questions).toHaveLength(8);
    expect(new Set(launch.questions.map((question) => question.id))).toEqual(expectedIds);
    expect(new Set(launch.questions.map((question) => question.interaction.type))).toEqual(
      new Set(['single_choice', 'sequence_order', 'drag_to_target'])
    );
  });

  it('keeps independently authored reading evidence separate from bicycle-fact mastery', () => {
    const reading = getFreePackQuestions(packId).find(
      (question) => question.id === 'bicycle.workshop.reading.detail.001'
    );
    expect(reading).toBeTruthy();
    expect(reading?.authoring.source).toBe('kidsplay-independent-curriculum-companion');
    expect(reading?.knowledgeRefs).toBeUndefined();

    const result = evaluate(reading!, { selectedOptionIds: ['helmet'] });
    expect(result.correct).toBe(true);
    expect(result.knowledgeEvidence).toEqual([]);
    expect(result.masteryEvidence.map((item) => item.conceptId)).toEqual([
      'capability.english.reading.literal-retrieval'
    ]);
  });

  it('contains no source chapter title, source PDF identity or chapter-local mastery claim', () => {
    for (const question of getFreePackQuestions(packId)) {
      const serialized = JSON.stringify(question);
      expect(serialized).not.toMatch(/My Bicycle/i);
      expect(serialized).not.toContain('bemr101.pdf');
      expect((question.knowledgeRefs ?? []).some((ref) => ref.startsWith('claim.chapter.'))).toBe(false);
    }
  });
});
