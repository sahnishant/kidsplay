import type { Question, SequenceOrderQuestion } from '../contracts/question';

export interface StudioWordReferences {
  termId: string;
  conceptRef: string;
  knowledgeRef: string;
}

/** Source-scoped reconstruction from a printed model, never a phonics assessment. */
export function projectStudioWord(source: Question, refs: StudioWordReferences): SequenceOrderQuestion;
