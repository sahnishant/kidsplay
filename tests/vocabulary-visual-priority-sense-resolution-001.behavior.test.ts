import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

const sourcePath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.items.json';
const manifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.json';
const projectedPath = 'content/vocabulary-visuals/batches/__generated-priority-sense-resolution-batch-001.json';

describe('#99 priority exact-sense resolution tranche', () => {
  it('is ledger-driven and projects the committed human review source without semantic drift', () => {
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
      status: 'human_reviewed_exact_sense',
      authority: { defaultKind: 'human_reviewed_candidate_selection', runtimeAuthority: 'none' },
      source: { kind: 'reviewed_items_file', reviewDataPath: sourcePath, expectedItemCount: 30 },
      output: { path: projectedPath, projectionMode: 'byte_identical_review_source' }
    });
    expect(projected).toEqual(source);
    expect(projected.items).toHaveLength(30);
  });

  it('resolves every selected sense to a pinned candidate and carries auditable source trace', () => {
    const batch = readJson(projectedPath);
    const sourceQueue = readJson('content/vocabulary-visuals/__generated-priority-gap-pre-batch-003.json');
    const sourceByLemma = new Map(sourceQueue.items.map((item: any) => [item.lemma, item]));

    for (const item of batch.items) {
      const source = sourceByLemma.get(item.lemma) as any;
      expect(source).toBeTruthy();
      expect(item).toMatchObject({
        maturity: expect.stringMatching(/^V[12]$/),
        reviewSource: 'human_exact_candidate_selection',
        reviewDisposition: 'human_selected_exact_candidate',
        answerSafety: 'neutral_safe'
      });
      expect(item.senseKey).not.toMatch(/#unresolved$/);
      expect(item.sourceTrace).toMatchObject({
        sourceCorpusId: source.sourceCorpusId,
        candidateSenseCount: source.candidateSenseCount,
        candidateIds: source.candidateIds,
        selectedCandidateId: item.senseKey,
        candidateReviewStatus: 'selected'
      });
      expect(source.candidateIds).toContain(item.senseKey);
    }
  });

  it('contains no source glosses, examples, profile placement or runtime authority', () => {
    const batch = readJson(projectedPath);
    expect(batch.policy).toMatchObject({
      definitionsIncluded: false,
      sourceGlossesIncluded: false,
      sourceExamplesIncluded: false,
      profilePlacementInferred: false,
      runtimeMappingCreated: false,
      childDefinitionApprovalInferred: false
    });

    const forbiddenKeys = new Set([
      'definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples',
      'profileRef', 'profileRefs', 'runtimeUsage', 'runtimeAuthority'
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
