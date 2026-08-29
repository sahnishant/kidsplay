import type { Question } from '../contracts/question';

export interface EngineMountContext {
  question: Question;
  host: HTMLElement;
  onSubmit: (response: unknown) => void;
}

export interface InteractionEngine {
  key: string;
  mount: (context: EngineMountContext) => void;
}
