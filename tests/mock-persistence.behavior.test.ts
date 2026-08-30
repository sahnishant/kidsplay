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
      sectionSignature: 'assessment-contract-v1',
      questionSignature: 'question-contract-v1',
      state: {
        sessionId: 'session.one',
        index: 0,
        responses: [],
        submitted: false
      }
    });

    expect(loadMockCheckpoint()).toEqual(saved);
    expect(loadMockCheckpoint()?.questionIds).toEqual(['q.one', 'q.two', 'q.three']);
    expect(loadMockCheckpoint()?.questionSignature).toBe('question-contract-v1');

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
      questionSignature: '',
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

  it('stores internally consistent completion summaries and deduplicates the same session result', () => {
    const completion = {
      sessionId: 'session.saved',
      entryId: 'goal.pattern.2026-27',
      title: '35-Question Pattern Mock',
      questionCount: 35,
      correct: 28,
      earnedMarks: 31,
      maxMarks: 40,
      sections: [
        {
          id: 'logical_reasoning',
          title: 'Logical Reasoning',
          correct: 4,
          answered: 5,
          total: 5,
          accuracy: 0.8,
          earnedMarks: 4,
          maxMarks: 5
        },
        {
          id: 'science',
          title: 'Science',
          correct: 20,
          answered: 25,
          total: 25,
          accuracy: 0.8,
          earnedMarks: 20,
          maxMarks: 25
        },
        {
          id: 'achievers',
          title: 'Achievers',
          correct: 4,
          answered: 5,
          total: 5,
          accuracy: 0.8,
          earnedMarks: 7,
          maxMarks: 10
        }
      ]
    };

    recordMockCompletion(completion);
    recordMockCompletion(completion);

    const history = loadMockHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      questionCount: 35,
      correct: 28,
      earnedMarks: 31,
      maxMarks: 40
    });
    expect(history[0].sections[1].title).toBe('Science');
  });

  it('computes latest, best and previous score movement by mock', () => {
    const trendInput: MockHistoryRecord[] = [
      {
        version: 1,
        sessionId: 'session.older',
        entryId: 'goal.pattern.2026-27',
        title: '35-Question Pattern Mock',
        completedAt: '2026-08-29T10:00:00.000Z',
        questionCount: 35,
        correct: 22,
        earnedMarks: 24,
        maxMarks: 40,
        sections: []
      },
      {
        version: 1,
        sessionId: 'session.latest',
        entryId: 'goal.pattern.2026-27',
        title: '35-Question Pattern Mock',
        completedAt: '2026-08-30T10:00:00.000Z',
        questionCount: 35,
        correct: 28,
        earnedMarks: 32,
        maxMarks: 40,
        sections: []
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
