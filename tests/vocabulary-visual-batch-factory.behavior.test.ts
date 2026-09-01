import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertSourceQueueMatchesManifest,
  compileReviewedBatches,
  itemFingerprint,
  semanticFingerprintForQueue,
  validateLedgerShape
} from '../scripts/vocabulary-visuals/compile-reviewed-batches.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const manifest2Path = 'content/vocabulary-visuals/review-batches/priority-batch-002.json';
const manifest3Path = 'content/vocabulary-visuals/review-batches/priority-batch-003.json';

const forbiddenPayloadKeys = ['definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples', 'childDefinition', 'profileRef'];

describe('#94 generic semantic-vocabulary review-batch factory', () => {
  it('stores reviewed decisions in a deterministic ledger/manifests while generated projections remain rebuildable', () => {
    const ledger = readJson(ledgerPath);
    const manifest2 = readJson(manifest2Path);
    const manifest3 = readJson(manifest3Path);
    const manifests = new Map([[manifest2Path, manifest2], [manifest3Path, manifest3]]);

    expect(() => validateLedgerShape(ledger, manifests)).not.toThrow();
    expect(ledger).toMatchObject({ schemaVersion: 1, parentIssueRef: 76, generatedFilePolicy: 'rebuild_and_ignore' });
    expect(ledger.batches.map((entry: { id: string }) => entry.id)).toEqual(['priority-batch-002', 'priority-batch-003']);

    const serialized = JSON.stringify({ ledger, manifest2, manifest3 });
    for (const key of forbiddenPayloadKeys) expect(serialized).not.toContain(`\"${key}\"`);
    expect(readText('.gitignore')).toContain('content/vocabulary-visuals/batches/__generated-*.json');
    expect(readText('.gitignore')).toContain('content/vocabulary-visuals/__generated-priority-gap*.json');
  });

  it('reproduces the exact historical source and reviewed-item fingerprints for batches 002 and 003', () => {
    const manifest2 = readJson(manifest2Path);
    const manifest3 = readJson(manifest3Path);
    const source2 = readJson(manifest2.source.snapshotPath);
    const source3 = readJson(manifest3.source.snapshotPath);
    const batch2 = readJson(manifest2.output.path);
    const batch3 = readJson(manifest3.output.path);

    expect(source2.items).toHaveLength(2319);
    expect(source3.items).toHaveLength(2205);
    expect(semanticFingerprintForQueue(source2)).toBe(manifest2.source.expectedSemanticFingerprint);
    expect(semanticFingerprintForQueue(source3)).toBe(manifest3.source.expectedSemanticFingerprint);
    expect(itemFingerprint(batch2.items)).toBe(manifest2.output.expectedItemFingerprint);
    expect(itemFingerprint(batch3.items)).toBe(manifest3.output.expectedItemFingerprint);

    expect(batch2.summary).toMatchObject({ items: 117, sceneGrammarItems: 70, textualOnlyItems: 47, humanReviewedSenseItems: 10, runtimeProofCandidates: 3 });
    expect(batch3.summary).toMatchObject({ items: 2205, exactSingleCandidateTextualOnly: 389, polysemyUnresolved: 1816, missingCandidateUnresolved: 0, runtimeMappings: 0 });
  });

  it('fails stale source fingerprints and duplicate ledger metadata closed', () => {
    const manifest2 = readJson(manifest2Path);
    const source2 = structuredClone(readJson(manifest2.source.snapshotPath));
    source2.items[0].candidateSenseCount += 1;
    expect(() => assertSourceQueueMatchesManifest(manifest2, source2)).toThrow(/stale source queue/);

    const manifest3 = readJson(manifest3Path);
    const duplicateLedger = {
      schemaVersion: 1,
      parentIssueRef: 76,
      generatedFilePolicy: 'rebuild_and_ignore',
      batches: [
        { id: manifest2.id, sequence: manifest2.sequence, issueRef: manifest2.issueRef, manifest: manifest2Path },
        { id: manifest2.id, sequence: manifest3.sequence, issueRef: manifest3.issueRef, manifest: manifest3Path }
      ]
    };
    const manifests = new Map([[manifest2Path, manifest2], [manifest3Path, { ...manifest3, id: manifest2.id }]]);
    expect(() => validateLedgerShape(duplicateLedger, manifests)).toThrow(/Duplicate review batch id/);
  });

  it('keeps candidate-only queues fail-closed and batch 003 terminal rules from selecting polysemous senses', () => {
    const source3 = readJson('content/vocabulary-visuals/__generated-priority-gap-pre-batch-003.json');
    const batch3 = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    const sourceByLemma = new Map(source3.items.map((item: any) => [item.lemma, item]));

    expect(source3.items.every((item: any) => item.status === 'candidate_only_not_v1' && item.policy?.senseApproved === false)).toBe(true);
    for (const item of batch3.items) {
      const source = sourceByLemma.get(item.lemma) as any;
      if (source.candidateSenseCount === 1) {
        expect(item).toMatchObject({ senseKey: source.candidateIds[0], strategy: 'textual_only', maturity: 'V1' });
      } else {
        expect(item).toMatchObject({ senseKey: `${item.lemma}#unresolved`, strategy: 'sense_unresolved', maturity: 'V1' });
      }
    }
  });

  it('is idempotent and leaves the completed priority accounting and runtime boundary unchanged', () => {
    const first = compileReviewedBatches({ ledgerPath });
    const second = compileReviewedBatches({ ledgerPath });
    expect(second).toEqual(first);
    expect(first.map((result: { id: string }) => result.id)).toEqual(['priority-batch-002', 'priority-batch-003']);

    const liveGap = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    expect(liveGap.items).toHaveLength(0);
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const batch3 = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    const terminalSenseKeys = new Set(batch3.items.map((item: { senseKey: string }) => item.senseKey));
    expect(runtime.plans.every((plan: { senseKey: string }) => !terminalSenseKeys.has(plan.senseKey))).toBe(true);
  });
});
