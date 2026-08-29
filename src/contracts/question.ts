export interface Prompt {
  text: string;
}

export interface SceneStimulus {
  type: 'scene';
  sceneId: string;
}

export interface Feedback {
  correct: string;
  incorrect: string;
}

export interface AuthoringMetadata {
  status: 'draft' | 'reviewed';
  source: string;
}

export interface BaseQuestion {
  id: string;
  revision: number;
  schemaVersion: 1;
  conceptIds: string[];
  gradeBands: number[];
  difficulty: number;
  language: string;
  prompt: Prompt;
  stimulus?: SceneStimulus;
  feedback: Feedback;
  authoring: AuthoringMetadata;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  interaction: {
    type: 'single_choice';
    version: 1;
    shuffleOptions?: boolean;
    options: ChoiceOption[];
  };
  solution: {
    type: 'exact_option';
    correctOptionIds: string[];
  };
}

export type FillSegment =
  | { type: 'text'; value: string }
  | { type: 'blank'; id: string };

export interface WordBankItem {
  id: string;
  label: string;
}

export interface WordBankFillQuestion extends BaseQuestion {
  interaction: {
    type: 'word_bank_fill';
    version: 1;
    segments: FillSegment[];
    wordBank: WordBankItem[];
  };
  solution: {
    type: 'blank_answers';
    answers: Record<string, string[]>;
  };
}

export interface DragItem {
  id: string;
  label: string;
  symbol?: string;
}

export interface DragTarget {
  id: string;
  label: string;
  symbol?: string;
}

export interface DragToTargetQuestion extends BaseQuestion {
  interaction: {
    type: 'drag_to_target';
    version: 1;
    items: DragItem[];
    targets: DragTarget[];
  };
  solution: {
    type: 'target_assignment';
    assignments: Record<string, string>;
  };
}

export type WordSearchDirection =
  | 'right'
  | 'left'
  | 'down'
  | 'up'
  | 'down_right'
  | 'down_left'
  | 'up_right'
  | 'up_left';

export interface WordSearchTerm {
  id: string;
  label: string;
  word: string;
}

export interface WordSearchQuestion extends BaseQuestion {
  interaction: {
    type: 'word_search';
    version: 1;
    seed: number;
    gridSize?: number;
    directions?: WordSearchDirection[];
    alphabet?: string;
    terms: WordSearchTerm[];
  };
  solution: {
    type: 'found_terms';
    requiredTermIds: string[];
  };
}

export type Question =
  | SingleChoiceQuestion
  | WordBankFillQuestion
  | DragToTargetQuestion
  | WordSearchQuestion;
