import { beforeEach, describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import {
  loadChildSettings,
  loadProgress,
  recordAttempt,
  saveChildSettings,
  summarizeProgress,
  summarizeTopicProgress,
  type MasteryCounter,
  type ProgressSnapshot
} from '../src/runtime/localProgress';
import { createSessionState, submitResponse } from '../src/runtime/session';

function testQuestion(): SingleChoiceQuestion {
  return {
    id: 'test.animals.dog.choice.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.animals.domestic'],
    knowledgeRefs: ['kr.test.animals.dog.domestic'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Which animal is a common pet?' },
    feedback: {
      correct: 'Yes, a dog is a common pet.',
      incorrect: 'Try the animal that often lives with people.'
    },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'dog', label: 'Dog' },
        { id: 'whale', label: 'Whale' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['dog'] }
  };
}

function counter(attempts: number, correct: number): MasteryCounter {
  return {
    attempts,
    correct,
    totalWeight: attempts,
    correctWeight: correct,
    lastResult: correct === attempts ? 'correct' : 'incorrect',
    lastSeenAt: '2026-08-29T12:00:00.000Z'
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('offline progress persistence', () => {
  it('persists player settings on the device', () => {
    const saved = saveChildSettings({ name: 'Dheu', avatar: 'owl' });
    expect(saved).toEqual({ name: 'Dheu', avatar: 'owl' });
    expect(loadChildSettings()).toEqual(saved);
  });

  it('normalizes whitespace around the child name before display/persistence', () => {
    const saved = saveChildSettings({ name: '   Dheu   ', avatar: 'fox' });
    expect(saved.name).toBe('Dheu');
    expect(loadChildSettings().name).toBe('Dheu');
  });

  it('persists attempts and aggregates row and concept mastery', () => {
    const question = testQuestion();

    for (let index = 0; index < 2; index += 1) {
      const state = createSessionState();
      const result = submitResponse(state, question, { selectedOptionIds: ['dog'] });
      expect(result).not.toBeNull();
      recordAttempt({
        question,
        response: state.responses[0],
        result: result!
      });
    }

    const progress = loadProgress();
    const knowledge = progress.knowledge['kr.test.animals.dog.domestic'];
    const concept = progress.concepts['test.animals.domestic'];
    const summary = summarizeProgress(progress);

    expect(progress.attempts).toHaveLength(2);
    expect(knowledge.attempts).toBe(2);
    expect(knowledge.correct).toBe(2);
    expect(concept.attempts).toBe(2);
    expect(summary.totalAttempts).toBe(2);
    expect(summary.accuracy).toBe(1);
    expect(summary.practicedKnowledge).toBe(1);
    expect(summary.masteredKnowledge).toBe(1);
    expect(summary.topics).toHaveLength(17);
    expect(summary.recommendedTopics).toHaveLength(0);
  });

  it('does not double-count an identical submitted attempt if the UI replays the write', () => {
    const question = testQuestion();
    const state = createSessionState();
    const result = submitResponse(state, question, { selectedOptionIds: ['dog'] });
    expect(result).not.toBeNull();
    const attempt = { question, response: state.responses[0], result: result! };

    recordAttempt(attempt);
    recordAttempt(attempt);

    const progress = loadProgress();
    expect(progress.attempts).toHaveLength(1);
    expect(progress.knowledge['kr.test.animals.dog.domestic'].attempts).toBe(1);
    expect(progress.concepts['test.animals.domestic'].attempts).toBe(1);
  });

  it('drops corrupt local evidence instead of letting it distort progress', () => {
    window.localStorage.setItem('kidsplay.progress.v1', JSON.stringify({
      version: 1,
      attempts: [
        {
          sessionId: 'session.valid',
          questionId: 'question.valid',
          submittedAt: '2026-08-29T12:00:00.000Z',
          durationMs: 1200,
          correct: true,
          score: 1,
          maxScore: 1,
          knowledgeRefs: ['kr.animals.valid'],
          conceptIds: ['animals.valid']
        },
        {
          sessionId: 'session.corrupt',
          questionId: 'question.corrupt',
          submittedAt: 'not-a-date',
          durationMs: -50,
          correct: true,
          score: 2,
          maxScore: 1,
          knowledgeRefs: ['kr.plants.corrupt'],
          conceptIds: []
        }
      ],
      knowledge: {
        'kr.animals.valid': counter(2, 2),
        'kr.plants.negative': {
          attempts: -3,
          correct: 9,
          totalWeight: -3,
          correctWeight: 9,
          lastResult: 'correct',
          lastSeenAt: 'bad-date'
        }
      },
      concepts: {
        'animals.valid': counter(2, 2),
        'plants.impossible': {
          attempts: 1,
          correct: 2,
          totalWeight: 1,
          correctWeight: 2,
          lastResult: 'incorrect',
          lastSeenAt: '2026-08-29T12:00:00.000Z'
        }
      },
      updatedAt: 'not-a-date'
    }));

    const progress = loadProgress();
    expect(progress.attempts.map((attempt) => attempt.questionId)).toEqual(['question.valid']);
    expect(Object.keys(progress.knowledge)).toEqual(['kr.animals.valid']);
    expect(Object.keys(progress.concepts)).toEqual(['animals.valid']);
    expect(progress.updatedAt).toBeNull();
    expect(summarizeProgress(progress)).toMatchObject({
      totalAttempts: 1,
      correctAttempts: 1,
      practicedKnowledge: 1,
      masteredKnowledge: 1
    });
  });

  it('summarizes practised evidence into topic-level learning signals and fills next focus with new breadth', () => {
    const snapshot: ProgressSnapshot = {
      version: 1,
      attempts: [],
      knowledge: {
        'kr.animals.one': counter(2, 2),
        'kr.animals.two': counter(2, 2),
        'kr.animals.three': counter(2, 2),
        'kr.plants.one': counter(2, 1)
      },
      concepts: {},
      updatedAt: null
    };

    const topics = summarizeTopicProgress(snapshot);
    const animals = topics.find((topic) => topic.id === 'animals');
    const plants = topics.find((topic) => topic.id === 'plants');
    const human = topics.find((topic) => topic.id === 'human');
    const summary = summarizeProgress(snapshot);

    expect(animals).toMatchObject({ practicedKnowledge: 3, strongKnowledge: 3, accuracy: 1, status: 'strong' });
    expect(plants).toMatchObject({ practicedKnowledge: 1, strongKnowledge: 0, accuracy: 0.5, status: 'needs_practice' });
    expect(human).toMatchObject({ practicedKnowledge: 0, strongKnowledge: 0, accuracy: null, status: 'not_started' });
    expect(summary.recommendedTopics.map((topic) => topic.id)).toEqual(['plants', 'human', 'food']);
  });

  it('prioritizes weak and growing topics before suggesting an unpractised topic', () => {
    const snapshot: ProgressSnapshot = {
      version: 1,
      attempts: [],
      knowledge: {
        'kr.safety.one': counter(3, 1),
        'kr.reasoning.one': counter(3, 2),
        'kr.universe.one': counter(3, 3),
        'kr.universe.two': counter(3, 3),
        'kr.universe.three': counter(3, 3)
      },
      concepts: {},
      updatedAt: null
    };

    const summary = summarizeProgress(snapshot);
    const safety = summary.topics.find((topic) => topic.id === 'safety');
    const reasoning = summary.topics.find((topic) => topic.id === 'reasoning');
    const universe = summary.topics.find((topic) => topic.id === 'universe');

    expect(safety?.status).toBe('needs_practice');
    expect(reasoning?.status).toBe('growing');
    expect(universe?.status).toBe('strong');
    expect(summary.recommendedTopics.map((topic) => topic.id)).toEqual(['safety', 'reasoning', 'animals']);
  });
});
