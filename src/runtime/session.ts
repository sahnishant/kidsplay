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

export interface SessionCheckpointState {
  sessionId: string;
  index: number;
  responses: QuestionResponseEnvelope[];
  submitted: boolean;
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

function cloneResponse(response: QuestionResponseEnvelope): QuestionResponseEnvelope {
  return {
    ...response,
    hintsUsed: [...response.hintsUsed]
  };
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

export function createSessionCheckpoint(state: SessionState): SessionCheckpointState {
  return {
    sessionId: state.sessionId,
    index: state.index,
    responses: state.responses.map(cloneResponse),
    submitted: state.submitted
  };
}

export function restoreSessionState(
  questions: Question[],
  checkpoint: SessionCheckpointState
): SessionState {
  if (!checkpoint.sessionId || !Number.isInteger(checkpoint.index)) {
    throw new Error('Invalid session checkpoint identity');
  }
  if (checkpoint.index < 0 || checkpoint.index > questions.length) {
    throw new Error('Session checkpoint index is outside the question set');
  }
  if (checkpoint.index === questions.length && checkpoint.submitted) {
    throw new Error('Completed session checkpoint cannot remain submitted');
  }

  const expectedResponseCount = checkpoint.index + (checkpoint.submitted ? 1 : 0);
  if (checkpoint.responses.length !== expectedResponseCount) {
    throw new Error('Session checkpoint response count does not match its position');
  }

  const responses = checkpoint.responses.map(cloneResponse);
  const results = responses.map((response, responseIndex) => {
    const question = questions[responseIndex];
    if (!question
      || response.sessionId !== checkpoint.sessionId
      || response.questionId !== question.id
      || response.questionRevision !== question.revision
      || response.interactionType !== question.interaction.type
      || response.interactionVersion !== question.interaction.version) {
      throw new Error(`Session checkpoint response ${responseIndex + 1} does not match the current question contract`);
    }
    return evaluate(question, response.response);
  });

  const state: SessionState = {
    sessionId: checkpoint.sessionId,
    index: checkpoint.index,
    responses,
    results,
    submitted: checkpoint.submitted,
    lastResult: checkpoint.submitted ? results.at(-1) ?? null : null,
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
  state.sessionId = crypto.randomUUID();
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
