import { describe, expect, it } from 'vitest';
import { resolveStoryReaction } from '../src/story/storyReaction';

describe('persona-aware story micro reactions', () => {
  it('still avoids repetitive dialogue after a routine correct clue', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 0,
      previousCorrect: true,
      questionIndex: 2,
      attempts: 1,
      correctCount: 2
    })).toBeNull();
  });

  it('lets Dheu own a first miss with a confused, childlike reaction', () => {
    expect(resolveStoryReaction({
      correct: false,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 1,
      previousCorrect: true,
      questionIndex: 0,
      attempts: 1,
      correctCount: 0
    })).toMatchObject({
      speaker: 'Dheu',
      character: 'dheu',
      trigger: 'first-miss',
      expression: 'confused',
      motion: 'head-tilt'
    });
  });

  it('can also let Shaitanu tease on a first miss without making him the universal wrong-answer voice', () => {
    expect(resolveStoryReaction({
      correct: false,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 1,
      previousCorrect: true,
      questionIndex: 1,
      attempts: 1,
      correctCount: 0
    })).toMatchObject({
      speaker: 'Shaitanu',
      character: 'shaitanu',
      trigger: 'first-miss',
      expression: 'fake-innocent'
    });
  });

  it('turns repeated difficulty into a helping retry beat instead of another taunt', () => {
    expect(resolveStoryReaction({
      correct: false,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 2,
      previousCorrect: false,
      questionIndex: 0,
      attempts: 2,
      correctCount: 0
    })).toMatchObject({
      trigger: 'retry',
      intent: 'reassure'
    });
  });

  it('celebrates a recovery after a miss instead of treating all correct answers the same', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 1,
      previousCorrect: false,
      questionIndex: 0,
      attempts: 1,
      correctCount: 1
    })).toMatchObject({
      trigger: 'recovery',
      intent: 'celebrate'
    });
  });

  it('lets Shaitanu be reluctantly impressed by a correct hard clue', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 3,
      knowledgeRefCount: 3,
      isFinalQuestion: false,
      incorrectCount: 0,
      previousCorrect: true,
      questionIndex: 1,
      attempts: 1,
      correctCount: 2
    })).toMatchObject({
      speaker: 'Shaitanu',
      character: 'shaitanu',
      trigger: 'hard-clue',
      expression: 'admiring',
      delivery: 'reluctant'
    });
  });

  it('makes final-clue emotion depend on the result without changing evaluation', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 1,
      knowledgeRefCount: 1,
      isFinalQuestion: true,
      incorrectCount: 0,
      previousCorrect: true,
      questionIndex: 6,
      attempts: 1,
      correctCount: 7
    })).toMatchObject({
      speaker: 'Shaitanu',
      character: 'shaitanu',
      trigger: 'final-clue',
      expression: 'admiring'
    });

    expect(resolveStoryReaction({
      correct: false,
      difficulty: 1,
      knowledgeRefCount: 1,
      isFinalQuestion: true,
      incorrectCount: 2,
      previousCorrect: true,
      questionIndex: 6,
      attempts: 1,
      correctCount: 5
    })).toMatchObject({
      speaker: 'Scientu',
      character: 'scientu',
      trigger: 'final-clue',
      intent: 'reassure'
    });
  });
});
