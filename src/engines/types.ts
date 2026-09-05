import type { Component } from 'svelte';
import type { Question } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';

export type EngineSubmissionMode = 'auto_when_complete' | 'explicit';

export interface EngineProps<Q extends Question = Question> {
  question: Q;
  onSubmit: (response: unknown) => void;
  checkResponse: (response: unknown) => EvaluationResult;
  submissionMode?: EngineSubmissionMode;
  soundEnabled?: boolean;
  /** Optional host-owned workspace. Engines never write progress or storage directly. */
  initialState?: unknown;
  onStateChange?: (state: unknown) => void;
  /** Exploration emits observations, not graded attempts. The host owns evidence policy. */
  mode?: 'question' | 'explore';
}

export type EngineComponent = Component<any>;
