import type { Question } from '../contracts/question';
import type {
  EvaluationResult,
  QuestionResponseEnvelope,
  ResponseAssistanceKind
} from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';

export interface SessionRetryState {
  questionId: string;
  attemptNumber: number;
  assistanceKinds: ResponseAssistanceKind[];
}

export interface SessionState {
  sessionId: string;
  index: number;
  /** Latest response for each reached question. Retries replace only this completion view. */
  responses: QuestionResponseEnvelope[];
  /** Immutable evidence trail containing the first response and every later retry. */
  attemptHistory: QuestionResponseEnvelope[];
  results: EvaluationResult[];
  submitted: boolean;
  lastResult: EvaluationResult | null;
  retryState: SessionRetryState | null;
  startedAtEpoch: number;
  startedAtIso: string;
}

export interface SessionCheckpointState {
  sessionId: string;
  index: number;
  responses: QuestionResponseEnvelope[];
  /** Optional for backwards compatibility with checkpoints created before honest retry support. */
  attemptHistory?: QuestionResponseEnvelope[];
  submitted: boolean;
  retryState?: SessionRetryState | null;
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

function isAssistanceKind(value: unknown): value is ResponseAssistanceKind {
  return value === 'hint'
    || value === 'visual_scaffold'
    || value === 'answer_elimination'
    || value === 'demonstration'
    || value === 'explanation';
}

function normalizeAssistanceKinds(value: unknown): ResponseAssistanceKind[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isAssistanceKind))];
}

function cloneResponse(response: QuestionResponseEnvelope): QuestionResponseEnvelope {
  const attemptNumber = Number.isInteger(response.attempts) && response.attempts >= 1
    ? response.attempts
    : 1;
  const attemptKind = response.attemptKind === 'retry' || response.attemptKind === 'independent'
    ? response.attemptKind
    : attemptNumber > 1 ? 'retry' : 'independent';
  return {
    ...response,
    attempts: attemptNumber,
    attemptKind,
    assistanceKinds: normalizeAssistanceKinds(response.assistanceKinds),
    hintsUsed: Array.isArray(response.hintsUsed) ? [...response.hintsUsed] : []
  };
}

function cloneRetryState(retryState: SessionRetryState | null | undefined): SessionRetryState | null {
  if (!retryState) return null;
  return {
    questionId: retryState.questionId,
    attemptNumber: retryState.attemptNumber,
    assistanceKinds: normalizeAssistanceKinds(retryState.assistanceKinds)
  };
}

function responseMatchesQuestion(
  response: QuestionResponseEnvelope,
  question: Question,
  sessionId: string
): boolean {
  return response.sessionId === sessionId
    && response.questionId === question.id
    && response.questionRevision === question.revision
    && response.interactionType === question.interaction.type
    && response.interactionVersion === question.interaction.version;
}

function validateAttemptHistory(
  questions: Question[],
  checkpoint: SessionCheckpointState,
  responses: QuestionResponseEnvelope[],
  attemptHistory: QuestionResponseEnvelope[]
): void {
  const grouped = new Map<number, QuestionResponseEnvelope[]>();

  for (const response of attemptHistory) {
    const questionIndex = questions.findIndex((question) => question.id === response.questionId);
    const question = questions[questionIndex];
    if (questionIndex < 0 || !question || !responseMatchesQuestion(response, question, checkpoint.sessionId)) {
      throw new Error('Session checkpoint retry history does not match the current question contract');
    }
    if (questionIndex > checkpoint.index) {
      throw new Error('Session checkpoint retry history is ahead of its position');
    }

    const history = grouped.get(questionIndex) ?? [];
    const expectedAttemptNumber = history.length + 1;
    if (response.attempts !== expectedAttemptNumber
      || (expectedAttemptNumber === 1 && response.attemptKind !== 'independent')
      || (expectedAttemptNumber > 1 && response.attemptKind !== 'retry')) {
      throw new Error('Session checkpoint retry history has an invalid attempt sequence');
    }
    history.push(response);
    grouped.set(questionIndex, history);
  }

  responses.forEach((response, responseIndex) => {
    const history = grouped.get(responseIndex);
    if (!history?.length || history.at(-1)?.submittedAt !== response.submittedAt) {
      throw new Error('Session checkpoint latest response is not backed by its retry history');
    }
  });
}

export function createSessionState(): SessionState {
  const state: SessionState = {
    sessionId: crypto.randomUUID(),
    index: 0,
    responses: [],
    attemptHistory: [],
    results: [],
    submitted: false,
    lastResult: null,
    retryState: null,
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
    attemptHistory: state.attemptHistory.map(cloneResponse),
    submitted: state.submitted,
    retryState: cloneRetryState(state.retryState)
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

  const retryState = cloneRetryState(checkpoint.retryState);
  if (retryState && checkpoint.submitted) {
    throw new Error('Session checkpoint cannot be submitted while a retry is open');
  }

  const expectedResponseCount = checkpoint.index + ((checkpoint.submitted || retryState) ? 1 : 0);
  if (checkpoint.responses.length !== expectedResponseCount) {
    throw new Error('Session checkpoint response count does not match its position');
  }

  const responses = checkpoint.responses.map(cloneResponse);
  const results = responses.map((response, responseIndex) => {
    const question = questions[responseIndex];
    if (!question || !responseMatchesQuestion(response, question, checkpoint.sessionId)) {
      throw new Error(`Session checkpoint response ${responseIndex + 1} does not match the current question contract`);
    }
    return evaluate(question, response.response);
  });

  const attemptHistory = (checkpoint.attemptHistory ?? checkpoint.responses).map(cloneResponse);
  validateAttemptHistory(questions, checkpoint, responses, attemptHistory);

  if (retryState) {
    const currentQuestion = questions[checkpoint.index];
    const previousResponse = responses[checkpoint.index];
    const previousResult = results[checkpoint.index];
    if (!currentQuestion
      || !previousResponse
      || !previousResult
      || previousResult.correct
      || retryState.questionId !== currentQuestion.id
      || retryState.attemptNumber !== previousResponse.attempts + 1
      || retryState.attemptNumber < 2) {
      throw new Error('Session checkpoint retry state does not match the current failed response');
    }
  }

  const state: SessionState = {
    sessionId: checkpoint.sessionId,
    index: checkpoint.index,
    responses,
    attemptHistory,
    results,
    submitted: checkpoint.submitted,
    lastResult: checkpoint.submitted ? results[checkpoint.index] ?? null : null,
    retryState,
    startedAtEpoch: 0,
    startedAtIso: ''
  };
  resetClock(state);
  return state;
}

export function submitResponse(state: SessionState, question: Question, response: unknown): EvaluationResult | null {
  if (state.submitted) return null;
  if (state.retryState && state.retryState.questionId !== question.id) return null;

  const retryState = state.retryState;
  const attemptNumber = retryState?.attemptNumber ?? 1;
  if (attemptNumber === 1 && state.responses.length !== state.index) return null;
  if (attemptNumber > 1) {
    const previousResponse = state.responses[state.index];
    if (!previousResponse || previousResponse.questionId !== question.id) return null;
  }

  const submittedAt = new Date();
  const result = evaluate(question, response);
  const assistanceKinds = retryState ? [...retryState.assistanceKinds] : [];
  const envelope: QuestionResponseEnvelope = {
    sessionId: state.sessionId,
    questionId: question.id,
    questionRevision: question.revision,
    interactionType: question.interaction.type,
    interactionVersion: question.interaction.version,
    response,
    startedAt: state.startedAtIso,
    submittedAt: submittedAt.toISOString(),
    durationMs: submittedAt.getTime() - state.startedAtEpoch,
    attempts: attemptNumber,
    attemptKind: attemptNumber === 1 ? 'independent' : 'retry',
    assistanceKinds,
    hintsUsed: assistanceKinds.map((kind) => `retry:${kind}`)
  };

  state.submitted = true;
  state.lastResult = result;
  state.retryState = null;
  state.attemptHistory.push(envelope);
  if (attemptNumber === 1) {
    state.responses.push(envelope);
    state.results.push(result);
  } else {
    state.responses[state.index] = envelope;
    state.results[state.index] = result;
  }
  return result;
}

export function prepareRetry(
  state: SessionState,
  question: Question,
  assistanceKinds: ResponseAssistanceKind[] = []
): boolean {
  if (!state.submitted || !state.lastResult || state.lastResult.correct) return false;
  const previousResponse = state.responses[state.index];
  if (!previousResponse || previousResponse.questionId !== question.id) return false;

  state.retryState = {
    questionId: question.id,
    attemptNumber: previousResponse.attempts + 1,
    assistanceKinds: normalizeAssistanceKinds(assistanceKinds)
  };
  state.submitted = false;
  state.lastResult = null;
  resetClock(state);
  return true;
}

export function advanceSession(state: SessionState): void {
  state.index += 1;
  state.submitted = false;
  state.lastResult = null;
  state.retryState = null;
  resetClock(state);
}

export function replaySession(state: SessionState): void {
  state.sessionId = crypto.randomUUID();
  state.index = 0;
  state.responses.splice(0);
  state.attemptHistory.splice(0);
  state.results.splice(0);
  state.submitted = false;
  state.lastResult = null;
  state.retryState = null;
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
