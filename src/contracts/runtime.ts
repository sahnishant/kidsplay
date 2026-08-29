import type { Question } from './question';

export interface QuestionResponseEnvelope {
  sessionId: string;
  questionId: string;
  questionRevision: number;
  interactionType: Question['interaction']['type'];
  interactionVersion: number;
  response: unknown;
  startedAt: string;
  submittedAt: string;
  durationMs: number;
  attempts: number;
  hintsUsed: string[];
}

export interface MasteryEvidence {
  conceptId: string;
  result: 'correct' | 'incorrect';
  weight: number;
}

export interface EvaluationResult {
  correct: boolean;
  score: number;
  maxScore: number;
  feedbackKey: 'correct' | 'incorrect';
  masteryEvidence: MasteryEvidence[];
}
