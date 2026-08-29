import type { Question } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';

export interface EngineMountContext {
  question: Question;
  host: HTMLElement;
  onSubmit: (response: unknown) => void;
  /**
   * Stateless evaluation hook for interactions that need immediate feedback
   * before the whole question is complete (for example memory pairs).
   * The interaction engine still does not own answer/scoring rules.
   */
  checkResponse: (response: unknown) => EvaluationResult;
}

export interface InteractionEngine {
  key: string;
  mount: (context: EngineMountContext) => void;
}
