import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearMockCheckpoint,
  loadMockCheckpoint,
  loadMockHistory,
  recordMockCompletion,
  saveMockCheckpoint,
  summarizeMockHistory,
  type MockHistoryRecord
} from '../src/runtime/mockPersistence';

beforeEach(() => {
  window.localStorage.clear();
});

describe('offline mock persistence', () => {
  it('round-trips an exact question-order checkpoint and clears it explicitly', () => {
    const saved = saveMockCheckpoint({
      entryId: 'goal.pattern.2026-27',
      title: '35-Question Pattern Mock',
      questionIds: ['q.one', 'q.two', 'q.three'],
      sectionSignature: '[{"id":"science","count":3}]',
      state: {
        sessionId: 'session.one',
        index: 0,
        responses: [],
        submitted: false
      }
    });

    expect(loadMockCheckpoint()).toEqual(saved);
    expect(loadMockCheckpoint()?.questionIds).toEqual(['q.one', 'q.two', 'q.three']);

    clearMockCheckpoint();
    expect(loadMockCheckpoint()).toBeNull();
  });

  it('drops malformed or structurally stale checkpoints at the storage boundary', () => {
    window.localStorage.setItem('kidsplay.activeMock.v1', JSON.stringify({
      version: 1,
      entryId: 'goal.pattern.2026-27',
      title: 'Broken Mock',
      questionIds: ['q.one', 'q.one'],
      sectionSignature: '',
      state: {
        sessionId: 'session.bad',
        index: 2,
        responses: [],
        submitted: false
      },
      savedAt: 'not-a-date'
    }));

    expect(loadMockCheckpoint()).toBeNull();
  });

  it('stores bounded compact completion summaries and computes latest/best trend signals', () => {
    recordMockCompletion({
      sessionId: 'session.saved',
      entryId: 'goal.pattern.2026-27',
      title: '35-Question Pattern Mock',
      questionCount: 35,
      correct: 28,
      earnedMarks: 31,
      maxMarks: 40,
      sections: [
        {
          id: 'science',
          title: 'Science',
          correct: 21,
          answered: 25,
          total: 25,
          accuracy: 21 / 25,
          earnedMarks: 21,
          maxMarks: 25
        }
      ]
    });

    const history = loadMockHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      questionCount: 35,
      correct: 28,
      earnedMarks: 31,
      maxMarks: 40
    });
    expect(history[0].sections[0].title).toBe('Science');

    const trendInput: MockHistoryRecord[] = [
      {
        ...history[0],
        sessionId: 'session.older',
        completedAt: '2026-08-29T10:00:00.000Z',
        earnedMarks: 24
      },
      {
        ...history[0],
        sessionId: 'session.latest',
        completedAt: '2026-08-30T10:00:00.000Z',
        earnedMarks: 32
      }
    ];
    const [trend] = summarizeMockHistory(trendInput);

    expect(trend.attempts).toBe(2);
    expect(trend.latestPercent).toBe(0.8);
    expect(trend.bestPercent).toBe(0.8);
    expect(trend.previousPercent).toBe(0.6);
    expect(trend.deltaPoints).toBe(20);
    expect(trend.latestEarnedMarks).toBe(32);
  });
});
