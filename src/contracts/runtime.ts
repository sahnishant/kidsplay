import type { Question } from './question';

export type ResponseAttemptKind = 'independent' | 'retry';
export type ResponseAssistanceKind =
  | 'hint'
  | 'visual_scaffold'
  | 'answer_elimination'
  | 'demonstration'
  | 'explanation';

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
  /** 1 for the first independent response, then 2+ for retries. */
  attempts: number;
  attemptKind: ResponseAttemptKind;
  assistanceKinds: ResponseAssistanceKind[];
  hintsUsed: string[];
}

export interface MasteryEvidence {
  conceptId: string;
  result: 'correct' | 'incorrect';
  weight: number;
}

export interface KnowledgeEvidence {
  rowId: string;
  result: 'correct' | 'incorrect';
  weight: number;
}

export interface EvaluationResult {
  correct: boolean;
  score: number;
  maxScore: number;
  feedbackKey: 'correct' | 'incorrect';
  masteryEvidence: MasteryEvidence[];
  knowledgeEvidence: KnowledgeEvidence[];
}

export interface SessionAttempt {
  question: Question;
  response: QuestionResponseEnvelope;
  result: EvaluationResult;
}
