import { describe, expect, it } from 'vitest';
import {
  getSoundTrailMappings,
  getSoundTrailProgression,
  getSoundTrailQuestions,
  projectSoundTrailDiscovery,
  resolveSoundTrailAudioCue,
  soundTrailAudioReviewPending
} from '../src/experience/phonicsAdventureProduction';
import type { ProgressSnapshot, StoredAttempt } from '../src/runtime/localProgress';

function attempt(questionId: string, correct = true, submittedAt = '2026-09-04T10:00:00.000Z'): StoredAttempt {
  const cue = resolveSoundTrailAudioCue(questionId);
  return {
    sessionId: 'session.phonics.sound-trail.v1',
    questionId,
    submittedAt,
    durationMs: 900,
    correct,
    score: correct ? 1 : 0,
    maxScore: 1,
    knowledgeRefs: cue ? [`kr.phonics.${cue.phonemeId}`] : [],
    conceptIds: cue ? [cue.phonemeId] : [],
    attemptNumber: 1,
    attemptKind: 'independent',
    assistanceKinds: [],
    countsTowardAccuracy: true,
    masteryWeight: 1
  };
}

function progress(attempts: StoredAttempt[]): ProgressSnapshot {
  return { version: 1, attempts, knowledge: {}, concepts: {}, updatedAt: attempts.at(-1)?.submittedAt ?? null };
}

describe('sound-first literacy V1 production slice', () => {
  it('uses exactly three explicit validated en-IN phoneme/grapheme mappings', () => {
    const mappings = getSoundTrailMappings();
    expect(mappings).toHaveLength(3);
    expect(mappings.map((item) => item.phonemeId)).toEqual(['phoneme.en.m', 'phoneme.en.f', 'phoneme.en.s']);
    expect(mappings.every((item) => item.locale === 'en-IN' && item.authority === 'kidsplay_authored_validated')).toBe(true);
    expect(mappings.map((item) => item.examples[0].semanticRef)).toEqual([
      'entity.food.milk',
      'entity.animal.fish',
      'entity.nature.sun'
    ]);
  });

  it('keeps the authored hearing-to-recognition sequence and does not make tracing the foundation', () => {
    const progression = getSoundTrailProgression();
    expect(progression).toHaveLength(3);
    for (const sound of progression) {
      expect(sound.stages).toEqual([
        'hear',
        'discriminate',
        'connect_object_word',
        'grapheme',
        'recognition',
        'trace_after_grapheme'
      ]);
    }
  });

  it('delivers every sound through choice plus drag while keeping letter recognition after sound/object work', () => {
    const questions = getSoundTrailQuestions();
    expect(questions).toHaveLength(12);
    expect(new Set(questions.map((question) => question.interaction.type))).toEqual(new Set(['single_choice', 'drag_to_target']));

    for (const grapheme of ['m', 'f', 's']) {
      const soundQuestions = questions.filter((question) => question.id.includes(`.${grapheme}.`));
      expect(soundQuestions.map((question) => resolveSoundTrailAudioCue(question.id)?.stage)).toEqual([
        'discriminate', 'connect_object_word', 'grapheme', 'recognition'
      ]);
      expect(soundQuestions[0].prompt.text).not.toMatch(/letter/i);
      expect(soundQuestions[1].prompt.text).not.toMatch(/letter/i);
      expect(soundQuestions[2].prompt.text).toMatch(/letter/i);
    }
  });

  it('requires an explicit bundled sound cue for every evaluative question', () => {
    const questions = getSoundTrailQuestions();
    for (const question of questions) {
      const cue = resolveSoundTrailAudioCue(question.id);
      expect(cue).not.toBeNull();
      expect(cue?.bundledSrc).toMatch(/^\/audio\/kidsplay-v1\/prereader\/phoneme-[mfs]\.ogg$/);
    }
    expect(soundTrailAudioReviewPending()).toEqual(['prereader.phoneme.f', 'prereader.phoneme.s']);
  });

  it('derives one replay-safe Sound Trail discovery only after all three recognition outcomes are correct', () => {
    const m = 'phonics.sound-trail.m.recognition.001';
    const f = 'phonics.sound-trail.f.recognition.001';
    const s = 'phonics.sound-trail.s.recognition.001';

    expect(projectSoundTrailDiscovery(progress([attempt(m), attempt(f), attempt(s, false)]))).toEqual([]);

    const complete = projectSoundTrailDiscovery(progress([
      attempt(m),
      attempt(f, true, '2026-09-04T10:01:00.000Z'),
      attempt(s, true, '2026-09-04T10:02:00.000Z')
    ]));
    expect(complete).toHaveLength(1);
    expect(complete[0]).toMatchObject({
      discoveryId: 'discovery.phonics.sound-trail-v1',
      kind: 'vocabulary_semantic',
      canonicalRefs: ['phoneme.en.f', 'phoneme.en.m', 'phoneme.en.s']
    });

    const replayed = projectSoundTrailDiscovery(progress([
      attempt(m), attempt(f), attempt(s),
      attempt(m, true, '2026-09-05T10:00:00.000Z'),
      attempt(f, true, '2026-09-05T10:01:00.000Z'),
      attempt(s, true, '2026-09-05T10:02:00.000Z')
    ]));
    expect(replayed).toHaveLength(1);
    expect(replayed[0].discoveryId).toBe(complete[0].discoveryId);
  });
});
