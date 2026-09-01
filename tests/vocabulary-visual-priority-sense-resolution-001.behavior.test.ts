import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

const sourcePath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.items.json';
const manifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.json';
const projectedPath = 'content/vocabulary-visuals/batches/__generated-priority-sense-resolution-batch-001.json';

describe('#99 priority exact-sense resolution tranche', () => {
  it('is ledger-driven and projects immutable source semantics with corrected Sol Max authority', () => {
    const ledger = readJson('content/vocabulary-visuals/review-batches/ledger.json');
    const manifest = readJson(manifestPath);
    const source = readJson(sourcePath);
    const projected = readJson(projectedPath);

    expect(ledger.batches).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'priority-sense-resolution-001', sequence: 4, issueRef: 99, manifest: manifestPath })
    ]));
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      issueRef: 99,
      parentIssueRef: 76,
      status: 'sol_max_reviewed_exact_sense',
      authority: {
        defaultKind: 'sol_max_reviewed_exact_sense',
        referenceState: 'sol_max_reviewed_exact_reference',
        resolutionState: 'sol_max_resolved',
        runtimeAuthority: 'none'
      },
      source: {
        kind: 'reviewed_items_file',
        reviewDataPath: sourcePath,
        expectedItemCount: 30,
        historicalStatus: 'human_reviewed_exact_sense'
      },
      reviewEvidence: {
        kind: 'sol_max_row_level_acceptance',
        pullRequest: 100,
        reviewNodeId: 'PRR_kwDOUHzR8c8AAAABLmzeeQ',
        acceptedRows: 30,
        claimsHumanEditorialReview: false
      },
      output: { path: projectedPath, projectionMode: 'authority_corrected_review_projection' }
    });
    expect(source.items).toHaveLength(30);
    expect(projected.items).toHaveLength(30);
    expect(projected.status).toBe('sol_max_reviewed_exact_sense');
    expect(projected.policy.claimsHumanEditorialReview).toBe(false);

    for (let index = 0; index < source.items.length; index += 1) {
      const before = source.items[index];
      const after = projected.items[index];
      for (const key of ['lemma', 'senseKey', 'partOfSpeech', 'strategy', 'sceneTemplate', 'maturity', 'motionPolicy', 'answerSafety', 'visualRef']) {
        expect(after[key]).toEqual(before[key]);
      }
      expect(after.parameters).toEqual(before.parameters);
      expect(after.sourceTrace.sourceCorpusId).toEqual(before.sourceTrace.sourceCorpusId);
      expect(after.sourceTrace.candidateIds).toEqual(before.sourceTrace.candidateIds);
      expect(after.sourceTrace.selectedCandidateId).toEqual(before.sourceTrace.selectedCandidateId);
      expect(after.reviewSource).toBe('sol_max_reviewed_exact_sense');
      expect(after.reviewDisposition).toBe('sol_max_selected_exact_candidate');
      expect(after.sourceTrace.candidateReviewStatus).toBe('sol_max_accepted');
    }
  });

  it('resolves every selected sense to the complete pinned candidate set and carries auditable source trace', () => {
    const batch = readJson(projectedPath);
    const pinnedCandidatesByLemma = new Map<string, string[]>();
    for (let grade = 1; grade <= 6; grade += 1) {
      const review = readJson(`content/lexicon/open/sense-review/grade-${grade}-introduced-meaning-oewn.json`);
      for (const candidate of review.candidates ?? []) {
        const values = pinnedCandidatesByLemma.get(candidate.lemma) ?? [];
        values.push(candidate.candidateId);
        pinnedCandidatesByLemma.set(candidate.lemma, values);
      }
    }

    for (const item of batch.items) {
      const pinned = [...new Set(pinnedCandidatesByLemma.get(item.lemma) ?? [])].sort();
      expect(item).toMatchObject({
        maturity: expect.stringMatching(/^V[12]$/),
        reviewSource: 'sol_max_reviewed_exact_sense',
        reviewDisposition: 'sol_max_selected_exact_candidate'
      });
      expect(['neutral_safe', 'post_answer_only']).toContain(item.answerSafety);
      expect(item.senseKey).not.toMatch(/#unresolved$/);
      expect(item.sourceTrace).toMatchObject({
        selectedCandidateId: item.senseKey,
        candidateReviewStatus: 'sol_max_accepted'
      });
      expect([...item.sourceTrace.candidateIds].sort()).toEqual(pinned);
      expect(item.sourceTrace.candidateSenseCount).toBe(pinned.length);
      expect(pinned).toContain(item.senseKey);
    }
  });

  it('contains no source glosses, examples, profile placement or unproved runtime authority', () => {
    const batch = readJson(projectedPath);
    expect(batch.policy).toMatchObject({
      definitionsIncluded: false,
      sourceGlossesIncluded: false,
      sourceExamplesIncluded: false,
      profilePlacementInferred: false,
      runtimeMappingCreated: false,
      childDefinitionApprovalInferred: false,
      claimsHumanEditorialReview: false
    });

    const forbiddenKeys = new Set([
      'definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples',
      'profileRef', 'profileRefs', 'runtimeUsage', 'runtimeAuthority', 'knowledgeRef'
    ]);
    const scan = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(scan);
      if (!value || typeof value !== 'object') return [];
      return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
        ...(forbiddenKeys.has(key) ? [key] : []),
        ...scan(nested)
      ]);
    };
    expect(scan(batch.items)).toEqual([]);
  });
});
