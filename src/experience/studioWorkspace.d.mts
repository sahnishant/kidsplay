import type { EqualPartsQuestion, SequenceOrderQuestion } from '../contracts/question';
type StudioQuestion = EqualPartsQuestion | SequenceOrderQuestion;
export interface StudioLearningState {
  mode: 'explore' | 'watch' | 'practice';
  demonstrationSeen: boolean;
  checkCount: number;
  stepIndex: number;
  checked: boolean;
}
export interface StudioWorkspace {
  schemaVersion: 2;
  activityId: string;
  questionId: string;
  questionRevision: number;
  engineKey: string;
  signature: string;
  state: unknown;
  learning: StudioLearningState;
}
export const INITIAL_STUDIO_LEARNING: Readonly<StudioLearningState>;
export function studioQuestionSignature(question: StudioQuestion): string;
export function isStudioResponse(question: StudioQuestion, state: unknown): boolean;
export function createStudioWorkspace(activityId: string, question: StudioQuestion, state: unknown, learning?: StudioLearningState): StudioWorkspace;
export function readStudioWorkspace(activityId: string, question: StudioQuestion, value: unknown): StudioWorkspace | null;
export function restoreStudioWorkspace(activityId: string, question: StudioQuestion, value?: unknown): unknown;
