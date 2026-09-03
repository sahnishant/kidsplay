import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TracePathQuestion } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import { getEngineComponent, getEngineRetryCapability } from '../src/runtime/engineRegistry';
import { getProfileMockQuestions, getProfilePatternMockQuestions } from '../src/content';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const fixture: TracePathQuestion = {
  id: 'trace.fixture',
  revision: 1,
  schemaVersion: 1,
  conceptIds: ['trace.test'],
  knowledgeRefs: ['kr.trace.test'],
  difficulty: 1,
  language: 'en',
  prompt: { text: 'Trace the path.' },
  feedback: { correct: 'Yes.', incorrect: 'Try again.' },
  authoring: { status: 'reviewed', source: 'test' },
  interaction: {
    type: 'trace_path',
    version: 1,
    board: {
      ariaLabel: 'Straight trace test',
      start: { id: 'start', label: 'Start', point: { x: 0.1, y: 0.5 } },
      goal: { id: 'goal', label: 'Goal', point: { x: 0.9, y: 0.5 } },
      guidePath: [
        { x: 0.1, y: 0.5 }, { x: 0.25, y: 0.5 }, { x: 0.4, y: 0.5 },
        { x: 0.55, y: 0.5 }, { x: 0.7, y: 0.5 }, { x: 0.9, y: 0.5 }
      ]
    }
  },
  solution: {
    type: 'trace_corridor',
    minPointCount: 6,
    startRadius: 0.12,
    goalRadius: 0.12,
    corridorRadius: 0.08,
    minInCorridorRatio: 0.75,
    minGuideCoverage: 0.7
  }
};

const response = (points: Array<{ x: number; y: number }>) => ({ strokes: [{ points }] });

describe('Phase G1 trace-path interaction', () => {
  it('accepts an honest start-to-goal trace through the authored corridor', () => {
    const result = evaluate(fixture, response([
      { x: 0.1, y: 0.5 }, { x: 0.23, y: 0.51 }, { x: 0.38, y: 0.49 },
      { x: 0.54, y: 0.5 }, { x: 0.71, y: 0.51 }, { x: 0.9, y: 0.5 }
    ]));
    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
  });

  it('rejects a shortcut that leaves the route even when start and goal are correct', () => {
    const result = evaluate(fixture, response([
      { x: 0.1, y: 0.5 }, { x: 0.2, y: 0.2 }, { x: 0.35, y: 0.15 },
      { x: 0.55, y: 0.15 }, { x: 0.72, y: 0.2 }, { x: 0.9, y: 0.5 }
    ]));
    expect(result.correct).toBe(false);
    expect(result.score).toBeLessThan(1);
  });

  it('rejects malformed/out-of-range points and traces that do not start at the authored marker', () => {
    const result = evaluate(fixture, { strokes: [{ points: [
      { x: -1, y: 0.5 }, { x: 0.32, y: 0.5 }, { x: 0.42, y: 0.5 },
      { x: 0.56, y: 0.5 }, { x: 0.72, y: 0.5 }, { x: 0.9, y: 0.5 }
    ] }] });
    expect(result.correct).toBe(false);
  });

  it('registers a reusable reset-for-retry engine rather than a question-id component', () => {
    expect(getEngineComponent(fixture)).toBeTruthy();
    expect(getEngineRetryCapability(fixture)).toBe('reset_for_retry');
    const registry = readText('src/runtime/engineRegistry.ts');
    expect(registry).toContain("['trace_path@1', TracePath]");
    expect(registry).not.toContain('phaseg.trace.under.bridge.001');
  });

  it('ships three canonical usages across spatial and force concepts in one free playground', () => {
    const questions = readJson('content/questions/trace-path.json') as TracePathQuestion[];
    const pack = readJson('content/packs/free-trace-playground.json');
    expect(questions).toHaveLength(3);
    expect(new Set(questions.flatMap((question) => question.knowledgeRefs ?? [])).size).toBe(3);
    expect(new Set(questions.flatMap((question) => question.conceptIds)).size).toBeGreaterThanOrEqual(3);
    expect(questions.every((question) => question.interaction.type === 'trace_path')).toBe(true);
    expect(questions.every((question) => question.authoring.source === 'kidsplay-editorial-phase-g1')).toBe(true);
    expect(pack.profileRef).toBeUndefined();
    expect(pack.questionRefs).toEqual(questions.map((question) => question.id));
  });

  it('keeps the G1 trace content out of current Class-2 structured assessment selection', () => {
    const questions = readJson('content/questions/trace-path.json') as TracePathQuestion[];
    const traceIds = new Set(questions.map((question) => question.id));
    const membership = readJson('content/profile-memberships/SOF_INDIA_CLASS2.json');
    const memberRows = new Set(membership.members.map((member: { rowId: string }) => member.rowId));
    for (const question of questions) {
      expect((question.knowledgeRefs ?? []).some((rowId) => memberRows.has(rowId))).toBe(false);
    }
    expect(getProfileMockQuestions('SOF_INDIA_CLASS2', { count: 20 }).some((question) => traceIds.has(question.id))).toBe(false);
    expect(getProfilePatternMockQuestions('SOF_INDIA_CLASS2').some((question) => traceIds.has(question.id))).toBe(false);
  });

  it('keeps pointer, accessible fallback and phone touch-floor behavior in the generic engine', () => {
    const engine = readText('src/engines/TracePath.svelte');
    expect(engine).toContain('onpointerdown={beginTrace}');
    expect(engine).toContain('onpointermove={continueTrace}');
    expect(engine).toContain('onpointerup={finishTrace}');
    expect(engine).toContain('onpointercancel={cancelTrace}');
    expect(engine).toContain('setPointerCapture');
    expect(engine).toContain('touch-action: none');
    expect(engine).toContain('Move along path');
    expect(engine).toContain('aria-live="polite"');
    expect(engine).toContain('min-height: 48px');
  });
});
