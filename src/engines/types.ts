import type { Component } from 'svelte';
import type { Question } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';

export interface EngineProps<Q extends Question = Question> {
  question: Q;
  onSubmit: (response: unknown) => void;
  checkResponse: (response: unknown) => EvaluationResult;
}

export type EngineComponent = Component<any>;
