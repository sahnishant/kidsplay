import { beforeEach, describe, expect, it } from 'vitest';
import { loadAdaptiveInterestSignals, recordAdaptiveTopicInterest } from '../src/runtime/adaptiveInterest';
import { loadProgress } from '../src/runtime/localProgress';

describe('adaptive interest persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists a voluntary topic choice offline without creating mastery evidence', () => {
    const before = loadProgress();
    const signals = recordAdaptiveTopicInterest(['animals.lion'], '2026-09-04T10:00:00.000Z');

    expect(signals).toEqual([{
      kind: 'topic_choice',
      observedAt: '2026-09-04T10:00:00.000Z',
      conceptIds: ['animals.lion'],
      topicIds: ['animals']
    }]);
    expect(loadAdaptiveInterestSignals()).toEqual(signals);
    expect(loadProgress()).toEqual(before);
    expect(window.localStorage.getItem('kidsplay.progress.v1')).toBeNull();
  });

  it('bounds preference history independently of the canonical progress ledger', () => {
    for (let index = 0; index < 30; index += 1) {
      recordAdaptiveTopicInterest([`animals.choice-${index}`], new Date(Date.UTC(2026, 8, 4, 10, index)));
    }
    const signals = loadAdaptiveInterestSignals();
    expect(signals).toHaveLength(24);
    expect(signals[0].conceptIds).toEqual(['animals.choice-6']);
    expect(signals.at(-1)?.conceptIds).toEqual(['animals.choice-29']);
  });
});
