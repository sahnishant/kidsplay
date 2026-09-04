import type {
  StoryBeatDelivery,
  StoryBeatIntent,
  StoryCharacterAngle,
  StoryCharacterExpression,
  StoryCharacterId,
  StoryCharacterMotion,
  StoryCharacterPose
} from './storyTypes';

export type StoryReactionTrigger =
  | 'clue-found'
  | 'first-miss'
  | 'retry'
  | 'recovery'
  | 'hard-clue'
  | 'streak'
  | 'final-clue';

export type StoryReactionMood = 'happy' | 'thinking' | 'mischievous' | 'celebrate' | 'worried' | 'ready';

export interface StoryReactionView {
  speaker: 'Dheu' | 'Scientu' | 'Shaitanu';
  character: StoryCharacterId;
  mood: StoryReactionMood;
  expression: StoryCharacterExpression;
  pose: StoryCharacterPose;
  angle: StoryCharacterAngle;
  motion: StoryCharacterMotion;
  intent: StoryBeatIntent;
  delivery: StoryBeatDelivery;
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
  questionIndex?: number;
  attempts?: number;
  correctCount?: number;
}

type ReactionVariant = Omit<StoryReactionView, 'trigger'>;

const reactions: Record<StoryReactionTrigger, readonly ReactionVariant[]> = {
  'clue-found': [
    {
      speaker: 'Dheu',
      character: 'dheu',
      mood: 'happy',
      expression: 'wonder',
      pose: 'inspect',
      angle: 'three-quarter-right',
      motion: 'head-tilt',
      intent: 'wonder',
      delivery: 'excited',
      text: 'Ooh! That clue fits. What changed?'
    },
    {
      speaker: 'Scientu',
      character: 'scientu',
      mood: 'celebrate',
      expression: 'aha',
      pose: 'inspect',
      angle: 'three-quarter-left',
      motion: 'bounce',
      intent: 'observe',
      delivery: 'excited',
      text: 'Aha! First clue locked in. Keep watching what fits.'
    }
  ],
  'first-miss': [
    {
      speaker: 'Dheu',
      character: 'dheu',
      mood: 'worried',
      expression: 'confused',
      pose: 'thinking',
      angle: 'three-quarter-right',
      motion: 'head-tilt',
      intent: 'react',
      delivery: 'gentle',
      text: 'Oops. That one fooled me too. Look again?'
    },
    {
      speaker: 'Shaitanu',
      character: 'shaitanu',
      mood: 'thinking',
      expression: 'fake-innocent',
      pose: 'proud',
      angle: 'three-quarter-left',
      motion: 'chuckle',
      intent: 'tease',
      delivery: 'boast',
      text: 'Heh-heh. Tempting, wasn’t it? I did warn you I am clever.'
    }
  ],
  retry: [
    {
      speaker: 'Scientu',
      character: 'scientu',
      mood: 'thinking',
      expression: 'thinking',
      pose: 'inspect',
      angle: 'three-quarter-left',
      motion: 'inspect',
      intent: 'reassure',
      delivery: 'gentle',
      text: 'Tiny clue: ignore the loudest answer. Look for what actually fits.'
    },
    {
      speaker: 'Dheu',
      character: 'dheu',
      mood: 'ready',
      expression: 'retry-confident',
      pose: 'inspect',
      angle: 'three-quarter-right',
      motion: 'lean-in',
      intent: 'reassure',
      delivery: 'gentle',
      text: 'Okay. New try. This time I’m watching the clue, not the trick.'
    }
  ],
  recovery: [
    {
      speaker: 'Dheu',
      character: 'dheu',
      mood: 'celebrate',
      expression: 'excited',
      pose: 'action',
      angle: 'three-quarter-right',
      motion: 'jump',
      intent: 'celebrate',
      delivery: 'excited',
      text: 'Yes! That clue clicked!'
    },
    {
      speaker: 'Scientu',
      character: 'scientu',
      mood: 'celebrate',
      expression: 'aha',
      pose: 'inspect',
      angle: 'three-quarter-left',
      motion: 'bounce',
      intent: 'celebrate',
      delivery: 'excited',
      text: 'There it is. You changed your idea when the evidence changed.'
    }
  ],
  'hard-clue': [
    {
      speaker: 'Shaitanu',
      character: 'shaitanu',
      mood: 'mischievous',
      expression: 'admiring',
      pose: 'proud',
      angle: 'three-quarter-left',
      motion: 'recoil',
      intent: 'react',
      delivery: 'reluctant',
      text: 'Fine, fine. That was annoyingly clever.'
    },
    {
      speaker: 'Scientu',
      character: 'scientu',
      mood: 'celebrate',
      expression: 'aha',
      pose: 'inspect',
      angle: 'three-quarter-left',
      motion: 'point',
      intent: 'observe',
      delivery: 'excited',
      text: 'That was the tricky clue. You separated the important detail from the noise.'
    }
  ],
  streak: [
    {
      speaker: 'Shaitanu',
      character: 'shaitanu',
      mood: 'mischievous',
      expression: 'sly',
      pose: 'proud',
      angle: 'three-quarter-left',
      motion: 'wiggle',
      intent: 'tease',
      delivery: 'mutter',
      text: 'Three in a row? Hmph. I need a better trick.'
    },
    {
      speaker: 'Dheu',
      character: 'dheu',
      mood: 'celebrate',
      expression: 'happy-laugh',
      pose: 'action',
      angle: 'three-quarter-right',
      motion: 'clap',
      intent: 'celebrate',
      delivery: 'excited',
      text: 'Ha! We’re getting good at this.'
    }
  ],
  'final-clue': [
    {
      speaker: 'Shaitanu',
      character: 'shaitanu',
      mood: 'mischievous',
      expression: 'admiring',
      pose: 'proud',
      angle: 'three-quarter-left',
      motion: 'cape-swish',
      intent: 'callback',
      delivery: 'reluctant',
      text: 'Last clue. And yes... you may have beaten my best trick.'
    },
    {
      speaker: 'Scientu',
      character: 'scientu',
      mood: 'thinking',
      expression: 'thinking',
      pose: 'help',
      angle: 'three-quarter-left',
      motion: 'help',
      intent: 'reassure',
      delivery: 'gentle',
      text: 'One last wobble. Keep the clue in mind when we finish the trail.'
    }
  ]
};

function chooseVariant(trigger: StoryReactionTrigger, context: StoryReactionContext): ReactionVariant {
  const options = reactions[trigger];
  const seed =
    (context.questionIndex ?? 0)
    + context.difficulty
    + context.knowledgeRefCount
    + (context.correctCount ?? 0)
    + (context.attempts ?? 1);
  return options[Math.abs(seed) % options.length];
}

export function resolveStoryReaction(context: StoryReactionContext): StoryReactionView | null {
  const hardClue = context.difficulty >= 4 || (context.difficulty >= 3 && context.knowledgeRefCount >= 3);
  const firstMiss = !context.correct && context.incorrectCount === 1 && (context.attempts ?? 1) <= 1;
  const retry = !context.correct && ((context.attempts ?? 1) >= 2 || (context.incorrectCount >= 2 && context.previousCorrect === false));
  const recovery = context.correct && context.previousCorrect === false;
  const clueFound = context.correct && (context.correctCount ?? 0) === 1;
  const streak = context.correct && context.previousCorrect === true && (context.correctCount ?? 0) >= 3;

  let trigger: StoryReactionTrigger | null = null;
  if (context.isFinalQuestion) trigger = 'final-clue';
  else if (retry) trigger = 'retry';
  else if (firstMiss) trigger = 'first-miss';
  else if (recovery) trigger = 'recovery';
  else if (hardClue) trigger = 'hard-clue';
  else if (streak) trigger = 'streak';
  else if (clueFound) trigger = 'clue-found';

  if (!trigger) return null;

  const variant = chooseVariant(trigger, context);
  if (trigger === 'final-clue') {
    const finalVariant = context.correct ? reactions['final-clue'][0] : reactions['final-clue'][1];
    return { ...finalVariant, trigger };
  }
  return { ...variant, trigger };
}
