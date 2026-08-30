export type StoryReactionCharacter = 'scientu' | 'shaitanu';
export type StoryReactionMood = 'celebrate' | 'mischievous';
export type StoryReactionMotion = 'bounce' | 'wiggle';
export type StoryReactionTrigger = 'final-clue' | 'first-miss' | 'turnaround' | 'hard-clue';

export interface StoryReactionView {
  speaker: 'Scientu' | 'Shaitanu';
  character: StoryReactionCharacter;
  mood: StoryReactionMood;
  motion: StoryReactionMotion;
  text: string;
  trigger: StoryReactionTrigger;
}

export interface StoryReactionContext {
  correct: boolean;
  difficulty: number;
  knowledgeRefCount: number;
  isFinalQuestion: boolean;
  incorrectCount: number;
  previousCorrect: boolean | undefined;
}

export function resolveStoryReaction(context: StoryReactionContext): StoryReactionView | null {
  const hardClue = context.difficulty >= 4 || (context.difficulty >= 3 && context.knowledgeRefCount >= 3);
  const firstMiss = !context.correct && context.incorrectCount === 1;
  const turnaround = context.correct && context.previousCorrect === false;

  let trigger: StoryReactionTrigger | null = null;
  if (context.isFinalQuestion) trigger = 'final-clue';
  else if (firstMiss) trigger = 'first-miss';
  else if (turnaround) trigger = 'turnaround';
  else if (hardClue) trigger = 'hard-clue';

  if (!trigger) return null;

  if (context.correct) {
    const text = trigger === 'turnaround'
      ? 'You used the last clue to sharpen this answer. That is good detective work.'
      : trigger === 'final-clue'
        ? 'Final clue checked. We have enough evidence to finish this case.'
        : 'You separated the clues carefully. Shaitanu will need a cleverer trap.';

    return {
      speaker: 'Scientu',
      character: 'scientu',
      mood: 'celebrate',
      motion: 'bounce',
      text,
      trigger
    };
  }

  const text = trigger === 'final-clue'
    ? 'One last twist! Keep the evidence in mind when you review the case.'
    : trigger === 'first-miss'
      ? 'That guess sounded tempting, didn’t it? Keep the evidence in mind.'
      : 'I tangled two clues together. Untangle them on the next one!';

  return {
    speaker: 'Shaitanu',
    character: 'shaitanu',
    mood: 'mischievous',
    motion: 'wiggle',
    text,
    trigger
  };
}
