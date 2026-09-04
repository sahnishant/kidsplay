import { beforeEach, describe, expect, it } from 'vitest';
import animalAssociations from '../content/knowledge/animal-associations.json';
import animalFeatures from '../content/knowledge/animal-features.json';
import animalHomes from '../content/knowledge/animal-homes.json';
import animalYoungOnes from '../content/knowledge/animal-young-ones.json';
import earthUniverse from '../content/knowledge/class2-earth-universe.json';
import { evaluate } from '../src/evaluation/evaluate';
import { assertUniqueResolvedClueAnswer } from '../src/experience/clueContract';
import {
  RIDDLE_TIME_V1,
  projectRiddleToSurface,
  riddleKnowledgeRefs,
  riddleToSingleChoiceQuestion,
  type RiddleProductionItem
} from '../src/experience/riddleCatalog';
import { loadProgress, recordAttempt, summarizeProgress } from '../src/runtime/localProgress';
import { createSessionState, prepareRetry, submitResponse } from '../src/runtime/session';

interface AssociationEntry {
  rowId: string;
  subject: { id: string };
}

function associationEntries(value: unknown): AssociationEntry[] {
  if (Array.isArray(value)) return value.flatMap(associationEntries);
  if (!value || typeof value !== 'object') return [];
  const entries = (value as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry): entry is AssociationEntry => Boolean(
    entry
      && typeof entry === 'object'
      && typeof (entry as AssociationEntry).rowId === 'string'
      && typeof (entry as AssociationEntry).subject?.id === 'string'
  ));
}

const canonicalEntries = [
  animalAssociations,
  animalFeatures,
  animalHomes,
  animalYoungOnes,
  earthUniverse
].flatMap(associationEntries);

const rowsBySubject = new Map<string, Set<string>>();
for (const entry of canonicalEntries) {
  const rows = rowsBySubject.get(entry.subject.id) ?? new Set<string>();
  rows.add(entry.rowId);
  rowsBySubject.set(entry.subject.id, rows);
}

function semanticSubjectId(semanticRef: string): string {
  return semanticRef.split('.').at(-1) ?? semanticRef;
}

function resolveAgainstCanonicalRows(item: RiddleProductionItem) {
  const requiredRows = riddleKnowledgeRefs(item);
  return item.clue.candidateSemanticRefs.map((semanticRef) => {
    const subjectRows = rowsBySubject.get(semanticSubjectId(semanticRef)) ?? new Set<string>();
    return {
      semanticRef,
      satisfiesAllClues: requiredRows.every((rowId) => subjectRows.has(rowId))
    };
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Riddle Time V1 production slice', () => {
  it('ships actual R0 zero-reading toddler riddle candidates with one short clue and two semantic visuals', () => {
    const r0 = RIDDLE_TIME_V1.filter((item) => item.clue.demandBand === 'r0');
    expect(r0).toHaveLength(4);

    for (const item of r0) {
      expect(item.clue.readingRequired).toBe(false);
      expect(item.clue.clues).toHaveLength(1);
      expect(item.clue.clues[0].text?.length).toBeGreaterThan(0);
      expect(item.clue.candidateSemanticRefs).toHaveLength(2);
      expect(item.candidates).toHaveLength(2);
      expect(item.candidates.every((candidate) => candidate.visualRefs.length > 0)).toBe(true);
      expect(riddleToSingleChoiceQuestion(item).authoring.status).toBe('draft');
    }
  });

  it('ships actual R2 semantic-inference riddle candidates that combine multiple canonical relationships', () => {
    const r2 = RIDDLE_TIME_V1.filter((item) => item.clue.demandBand === 'r2');
    expect(r2).toHaveLength(4);

    for (const item of r2) {
      expect(item.clue.mechanism).toBe('inference');
      expect(item.clue.clues.length).toBeGreaterThanOrEqual(2);
      expect(new Set(riddleKnowledgeRefs(item)).size).toBeGreaterThanOrEqual(2);
      expect(riddleToSingleChoiceQuestion(item).authoring.status).toBe('draft');
    }
  });

  it('proves every production clue set has exactly one answer in its declared candidate universe using canonical rows', () => {
    for (const item of RIDDLE_TIME_V1) {
      expect(assertUniqueResolvedClueAnswer(item.clue, resolveAgainstCanonicalRows(item))).toBe(item.clue.answerSemanticRef);
    }
  });

  it('projects one production clue contract into Play, Learn About and Adventure through the shared placement authority', () => {
    const item = RIDDLE_TIME_V1.find((candidate) => candidate.clue.clueSetId === 'riddle.r2.earth.planet-third');
    expect(item).toBeDefined();
    if (!item) throw new Error('production riddle missing');

    const projections = (['play', 'learn_about', 'adventure'] as const).map((surface) =>
      projectRiddleToSurface(item, surface)
    );

    expect(new Set(projections.map((projection) => projection.clue.clueSetId))).toEqual(new Set([item.clue.clueSetId]));
    expect(new Set(projections.map((projection) => projection.question.id))).toEqual(new Set([`question.${item.clue.clueSetId}`]));
    expect(projections.every((projection) => projection.clue === item.clue)).toBe(true);
    expect(projections.map((projection) => projection.placement.surface)).toEqual(['play', 'learn_about', 'adventure']);
    expect(projections.every((projection) => projection.placement.evaluatorKey === 'single_choice@1')).toBe(true);
    expect(projections.every((projection) => projection.placement.clueSetId === item.clue.clueSetId)).toBe(true);

    for (const projection of projections) {
      const correctOptionId = projection.question.solution.correctOptionIds[0];
      expect(evaluate(projection.question, { selectedOptionIds: [correctOptionId] }).correct).toBe(true);
    }
  });

  it('keeps the first production-riddle miss as accuracy evidence after a scaffolded successful retry', () => {
    const item = RIDDLE_TIME_V1.find((candidate) => candidate.clue.clueSetId === 'riddle.r2.dog.domestic-kennel');
    expect(item).toBeDefined();
    if (!item) throw new Error('production riddle missing');

    const question = riddleToSingleChoiceQuestion(item);
    const correctOptionId = question.solution.correctOptionIds[0];
    const wrongOptionId = question.interaction.options.find((option) => option.id !== correctOptionId)?.id;
    if (!wrongOptionId) throw new Error('wrong option missing');

    const state = createSessionState();
    const firstResult = submitResponse(state, question, { selectedOptionIds: [wrongOptionId] });
    expect(firstResult?.correct).toBe(false);
    if (!firstResult) throw new Error('first result missing');
    recordAttempt({ question, response: state.attemptHistory[0], result: firstResult });

    expect(prepareRetry(state, question, ['visual_scaffold'])).toBe(true);
    const retryResult = submitResponse(state, question, { selectedOptionIds: [correctOptionId] });
    expect(retryResult?.correct).toBe(true);
    if (!retryResult) throw new Error('retry result missing');
    recordAttempt({ question, response: state.attemptHistory[1], result: retryResult });

    const snapshot = loadProgress();
    expect(snapshot.attempts).toHaveLength(2);
    expect(snapshot.attempts[0]).toMatchObject({ attemptKind: 'independent', countsTowardAccuracy: true, correct: false });
    expect(snapshot.attempts[1]).toMatchObject({
      attemptKind: 'retry',
      countsTowardAccuracy: false,
      correct: true,
      assistanceKinds: ['visual_scaffold'],
      masteryWeight: 0.25
    });

    const summary = summarizeProgress(snapshot);
    expect(summary.totalAttempts).toBe(1);
    expect(summary.correctAttempts).toBe(0);
    expect(summary.accuracy).toBe(0);

    for (const rowId of question.knowledgeRefs ?? []) {
      expect(snapshot.knowledge[rowId]).toMatchObject({ attempts: 1, correct: 0, lastResult: 'correct' });
      expect(snapshot.knowledge[rowId].correctWeight).toBeGreaterThan(0);
    }
  });
});
