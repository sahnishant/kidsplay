import { describe, expect, it } from 'vitest';
import { resolveStoryReaction } from '../src/story/storyReaction';

describe('selective story micro reactions', () => {
  it('does not add repetitive dialogue after a routine correct clue', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 0,
      previousCorrect: true
    })).toBeNull();
  });

  it('does not treat every difficulty-3 reasoning question as a story beat', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 3,
      knowledgeRefCount: 2,
      isFinalQuestion: false,
      incorrectCount: 0,
      previousCorrect: true
    })).toBeNull();
  });

  it('lets Shaitanu react to the first miss', () => {
    expect(resolveStoryReaction({
      correct: false,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 1,
      previousCorrect: true
    })).toMatchObject({
      speaker: 'Shaitanu',
      character: 'shaitanu',
      trigger: 'first-miss'
    });
  });

  it('lets Scientu react to a turnaround after a miss', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 1,
      previousCorrect: false
    })).toMatchObject({
      speaker: 'Scientu',
      character: 'scientu',
      trigger: 'turnaround'
    });
  });

  it('can react to a genuinely hard multi-clue question', () => {
    expect(resolveStoryReaction({
      correct: true,
      difficulty: 3,
      knowledgeRefCount: 3,
      isFinalQuestion: false,
      incorrectCount: 0,
      previousCorrect: true
    })).toMatchObject({
      speaker: 'Scientu',
      trigger: 'hard-clue'
    });
  });

  it('does not repeat Shaitanu dialogue for later routine misses', () => {
    expect(resolveStoryReaction({
      correct: false,
      difficulty: 2,
      knowledgeRefCount: 1,
      isFinalQuestion: false,
      incorrectCount: 2,
      previousCorrect: true
    })).toBeNull();
  });

  it('always allows a final-clue beat without changing answer evaluation', () => {
    expect(resolveStoryReaction({
      correct: false,
      difficulty: 1,
      knowledgeRefCount: 1,
      isFinalQuestion: true,
      incorrectCount: 2,
      previousCorrect: true
    })).toMatchObject({
      speaker: 'Shaitanu',
      trigger: 'final-clue'
    });
  });
});
