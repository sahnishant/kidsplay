import type { Question } from '../contracts/question';
import type { EvaluationResult, QuestionResponseEnvelope } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';

export interface SessionState {
  sessionId: string;
  index: number;
  responses: QuestionResponseEnvelope[];
  results: EvaluationResult[];
  submitted: boolean;
  lastResult: EvaluationResult | null;
  startedAtEpoch: number;
  startedAtIso: string;
}

export interface ScoredSessionSection {
  id: string;
  title: string;
  startIndex: number;
  count: number;
  marksPerQuestion: number;
}

export interface SectionScoreSummary {
  id: string;
  title: string;
  correct: number;
  answered: number;
  total: number;
  accuracy: number | null;
  earnedMarks: number;
  maxMarks: number;
}

function resetClock(state: SessionState): void {
  state.startedAtEpoch = Date.now();
  state.startedAtIso = new Date(state.startedAtEpoch).toISOString();
}

export function createSessionState(): SessionState {
  const state: SessionState = {
    sessionId: crypto.randomUUID(),
    index: 0,
    responses: [],
    results: [],
    submitted: false,
    lastResult: null,
    startedAtEpoch: 0,
    startedAtIso: ''
  };
  resetClock(state);
  return state;
}

export function submitResponse(state: SessionState, question: Question, response: unknown): EvaluationResult | null {
  if (state.submitted) return null;
  const submittedAt = new Date();
  const result = evaluate(question, response);
  state.submitted = true;
  state.lastResult = result;
  state.responses.push({
    sessionId: state.sessionId,
    questionId: question.id,
    questionRevision: question.revision,
    interactionType: question.interaction.type,
    interactionVersion: question.interaction.version,
    response,
    startedAt: state.startedAtIso,
    submittedAt: submittedAt.toISOString(),
    durationMs: submittedAt.getTime() - state.startedAtEpoch,
    attempts: 1,
    hintsUsed: []
  });
  state.results.push(result);
  return result;
}

export function advanceSession(state: SessionState): void {
  state.index += 1;
  state.submitted = false;
  state.lastResult = null;
  resetClock(state);
}

export function replaySession(state: SessionState): void {
  state.index = 0;
  state.responses.splice(0);
  state.results.splice(0);
  state.submitted = false;
  state.lastResult = null;
  resetClock(state);
}

export function summarizeSectionResults(
  sections: ScoredSessionSection[],
  results: EvaluationResult[]
): SectionScoreSummary[] {
  return sections.map((section) => {
    const sectionResults = results.slice(section.startIndex, section.startIndex + section.count);
    const correct = sectionResults.filter((result) => result.correct).length;
    return {
      id: section.id,
      title: section.title,
      correct,
      answered: sectionResults.length,
      total: section.count,
      accuracy: sectionResults.length ? correct / sectionResults.length : null,
      earnedMarks: correct * section.marksPerQuestion,
      maxMarks: section.count * section.marksPerQuestion
    };
  });
}
