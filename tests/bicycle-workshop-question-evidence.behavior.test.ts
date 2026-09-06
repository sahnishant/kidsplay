import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Question } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';

const playPath = 'content/curriculum-runtime/bicycle-workshop/questions/play.json';
const readingPath = 'content/curriculum-runtime/bicycle-workshop/questions/reading.json';
const policyPath = 'content/learning-graph/assessments/bicycle-workshop-evidence.json';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;
}

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/question-evidence.mjs'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop canonical question evidence', () => {
  it('covers all 32 questions without granting unreviewed semantic approval', () => {
    expect(validate()).toMatchObject({
      policyId: 'question-evidence.bicycle-workshop.v1',
      questionCount: 32,
      strongSemanticTargetCount: 8,
      practiceOnlyCount: 9,
      evidenceEligibleCount: 23,
      capabilityOnlyCount: 8,
      claimEvidenceQuestionCount: 15,
      processQuestionCount: 2,
      supportingKnowledgeQuestionCount: 3,
      knowledgeEvidenceForbiddenCount: 4,
      practiceOnlyInteractionTypeCount: 1,
      practiceOnlyInteractionCoverage: true,
      naturalLanguageEntailmentCertified: false
    });
  });

  it('uses a data-owned question directory and evidence boundaries rather than Bicycle-specific validator paths', () => {
    const policy = readJson<any>(policyPath);
    expect(policy.questionDirectory).toBe('content/curriculum-runtime/bicycle-workshop/questions');
    expect(policy.knowledgeEvidenceForbiddenQuestionRefs).toEqual([
      'bicycle.workshop.reading.detail.001',
      'bicycle.workshop.reading.sequence.001',
      'bicycle.workshop.reading.verify.001',
      'bicycle.workshop.reading.inference.001'
    ]);
    expect(policy.practiceOnlyInteractionTypes).toEqual(['word_search']);
    expect(policy.supportingKnowledgeByQuestion).toBeUndefined();
  });

  it('uses the direct canonical function claims for the repaired play activities', () => {
    const questions = readJson<Question[]>(playPath);
    const byId = new Map(questions.map((question) => [question.id, question]));

    expect(byId.get('bicycle.workshop.fill.pedal.001')?.knowledgeRefs).toEqual([
      'claim.bicycle.pedal.operated-by.rider-foot'
    ]);
    expect(byId.get('bicycle.workshop.fill.brake.001')?.knowledgeRefs).toEqual([
      'claim.bicycle.brake.used-for.slowing'
    ]);
    expect(byId.get('bicycle.workshop.match.parts-functions.001')?.knowledgeRefs).toEqual([
      'claim.bicycle.pedal.operated-by.rider-foot',
      'claim.bicycle.handlebar.controls.direction',
      'claim.bicycle.brake.used-for.slowing',
      'claim.bicycle.bell.used-for.signalling'
    ]);
  });

  it('keeps word-search denotation context reusable without turning spelling success into mastery', () => {
    const questions = readJson<any[]>(playPath);
    const wordSearch = questions.find((question) => question.id === 'bicycle.workshop.word-search.parts.001');
    expect(wordSearch).toBeDefined();
    expect(wordSearch.evidencePolicy).toBe('practice_only');
    expect(wordSearch.knowledgeRefs).toBeUndefined();
    expect(wordSearch.supportingKnowledgeRefs).toEqual([
      'claim.lexeme.pedal-noun.denotes.bicycle-pedal',
      'claim.lexeme.brake-noun.denotes.bicycle-brake',
      'claim.lexeme.bell.denotes.bicycle-bell',
      'claim.lexeme.tyre.denotes.bicycle-tyre'
    ]);

    const result = evaluate(wordSearch as Question, {
      foundTermIds: ['pedal', 'brake', 'bell', 'tyre']
    });
    expect(result.correct).toBe(true);
    expect(result.masteryEvidence).toEqual([]);
    expect(result.knowledgeEvidence).toEqual([]);
  });

  it('stores reading background facts on the question as supporting-only context', () => {
    const questions = readJson<any[]>(readingPath);
    const byId = new Map(questions.map((question) => [question.id, question]));
    expect(byId.get('bicycle.workshop.reading.verify.001')?.supportingKnowledgeRefs).toEqual([
      'claim.bicycle.bell.used-for.signalling'
    ]);
    expect(byId.get('bicycle.workshop.reading.inference.001')?.supportingKnowledgeRefs).toEqual([
      'claim.bicycle.brake.used-for.slowing'
    ]);
    expect(byId.get('bicycle.workshop.reading.verify.001')?.knowledgeRefs).toBeUndefined();
    expect(byId.get('bicycle.workshop.reading.inference.001')?.knowledgeRefs).toBeUndefined();

    const result = evaluate(byId.get('bicycle.workshop.reading.inference.001') as Question, {
      selectedOptionIds: ['slow']
    });
    expect(result.correct).toBe(true);
    expect(result.knowledgeEvidence).toEqual([]);
  });
});
