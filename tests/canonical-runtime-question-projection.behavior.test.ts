import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/evaluation/evaluate';
import type { Question } from '../src/contracts/question';
import { projectRuntimeQuestionJson } from '../scripts/learning-graph/runtime-question-projection.mjs';

const path = 'content/curriculum-runtime/bicycle-workshop/questions/core.json';
const source = readFileSync(path, 'utf8');
const authored = JSON.parse(source) as Question[];

describe('canonical question authoring/runtime export boundary', () => {
  it('removes only the audit object and preserves complete runtime contracts', () => {
    const projected = JSON.parse(projectRuntimeQuestionJson(source, path)) as Question[];
    expect(projected).toHaveLength(authored.length);
    expect(authored.filter((question) => question.semanticTarget)).toHaveLength(8);
    for (let index = 0; index < authored.length; index++) {
      const { semanticTarget, ...expected } = authored[index];
      expect(projected[index]).toEqual(expected);
      if (semanticTarget) {
        const question = projected[index];
        expect(question.evidencePolicy).toBe('practice_only');
        expect(question.authoring.status).toBe('draft');
        if (question.solution.type !== 'exact_option') throw new Error('Expected typed single-choice fixture');
        const answer = { selectedOptionIds: question.solution.correctOptionIds };
        expect(evaluate(question, answer)).toEqual(evaluate(authored[index], answer));
        expect(evaluate(question, answer).masteryEvidence).toEqual([]);
        expect(evaluate(question, answer).knowledgeEvidence).toEqual([]);
      }
    }
    expect(readFileSync(path, 'utf8')).toBe(source);
  });

  it('keeps all six Bicycle assets below the unchanged 48 KiB raw cap', () => {
    let bytes = 0;
    for (const directory of ['questions', 'packs']) {
      const root = `content/curriculum-runtime/bicycle-workshop/${directory}`;
      for (const filename of readdirSync(root).filter((name) => name.endsWith('.json'))) {
        const currentPath = `${root}/${filename}`;
        bytes += Buffer.byteLength(projectRuntimeQuestionJson(readFileSync(currentPath, 'utf8'), currentPath));
      }
    }
    expect(bytes).toBeLessThanOrEqual(48 * 1024);
  });

  it('normalizes Windows separators without changing output semantics', () => {
    expect(projectRuntimeQuestionJson(source, path.replaceAll('/', '\\'))).toBe(projectRuntimeQuestionJson(source, path));
  });

  it('does not inspect or rewrite non-question data, packs or memberships', () => {
    const data = '{ "semanticTarget": "unrelated field" }';
    for (const currentPath of ['content/knowledge/example.json', 'content/profile-memberships/example.json', 'content/curriculum-runtime/bicycle-workshop/packs/practice.json']) {
      expect(projectRuntimeQuestionJson(data, currentPath)).toBe(data);
    }
  });

  it('is idempotent and leaves ordinary question JSON byte-for-byte unchanged', () => {
    const projected = projectRuntimeQuestionJson(source, path);
    expect(projectRuntimeQuestionJson(projected, path)).toBe(projected);
    expect(projectRuntimeQuestionJson(' [ ] \n', 'content/questions/test.json')).toBe(' [ ] \n');
  });

  it.each(['evidencePolicy', 'authoring', 'semanticTarget'])('rejects a missing or invalid %s guard rather than exporting mastery', (field) => {
    const question = structuredClone(authored.find((item) => item.semanticTarget)!);
    if (field === 'evidencePolicy') delete question.evidencePolicy;
    if (field === 'authoring') question.authoring.status = 'reviewed';
    if (field === 'semanticTarget') question.semanticTarget = undefined;
    // Keep an explicit null metadata value for the malformed-target case.
    const values = field === 'semanticTarget' ? [{ ...question, semanticTarget: null }] : [question];
    expect(() => projectRuntimeQuestionJson(JSON.stringify(values), path)).toThrow(/cannot export/);
  });

  it('rejects malformed audit-bearing records and non-array question banks', () => {
    expect(() => projectRuntimeQuestionJson('[{"semanticTarget":{}}]', path)).toThrow(/supported question/);
    expect(() => projectRuntimeQuestionJson('{}', path)).toThrow(/must be an array/);
  });
});
