import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const manifest2Path = 'content/vocabulary-visuals/review-batches/priority-batch-002.json';
const manifest3Path = 'content/vocabulary-visuals/review-batches/priority-batch-003.json';
const compilerPath = resolve(process.cwd(), 'scripts/vocabulary-visuals/compile-reviewed-batches.mjs');
const forbiddenPayloadKeys = ['definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples', 'childDefinition', 'profileRef'];

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stableValue(object[key])]));
};
const stableJson = (value: unknown) => JSON.stringify(stableValue(value));
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const sourceFingerprint = (queue: any) => sha256(stableJson((queue.items ?? []).map((item: any) => ({
  lemma: item.lemma,
  partOfSpeech: item.partOfSpeech,
  grade: item.grade,
  sourceCorpusId: item.sourceCorpusId,
  candidateSenseCount: item.candidateSenseCount,
  candidateIds: item.candidateIds,
  polysemyRisk: item.polysemyRisk
}))));
const itemsFingerprint = (items: unknown[]) => sha256(stableJson(items));
const runCompiler = (ledger = ledgerPath) => execFileSync(process.execPath, [compilerPath, `--ledger=${ledger}`], { cwd: process.cwd(), encoding: 'utf8' });

describe('#94 generic semantic-vocabulary review-batch factory', () => {
  it('stores reviewed decisions in a deterministic ledger/manifests while generated projections remain rebuildable', () => {
    const ledger = readJson(ledgerPath);
    const manifest2 = readJson(manifest2Path);
    const manifest3 = readJson(manifest3Path);

    expect(ledger).toMatchObject({ schemaVersion: 1, parentIssueRef: 76, generatedFilePolicy: 'rebuild_and_ignore' });
    expect(ledger.batches.map((entry: { id: string }) => entry.id)).toEqual(['priority-batch-002', 'priority-batch-003']);
    expect(new Set(ledger.batches.map((entry: { id: string }) => entry.id)).size).toBe(ledger.batches.length);
    expect(new Set(ledger.batches.map((entry: { sequence: number }) => entry.sequence)).size).toBe(ledger.batches.length);

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
    expect(sourceFingerprint(source2)).toBe(manifest2.source.expectedSemanticFingerprint);
    expect(sourceFingerprint(source3)).toBe(manifest3.source.expectedSemanticFingerprint);
    expect(itemsFingerprint(batch2.items)).toBe(manifest2.output.expectedItemFingerprint);
    expect(itemsFingerprint(batch3.items)).toBe(manifest3.output.expectedItemFingerprint);

    expect(batch2.summary).toMatchObject({ items: 117, sceneGrammarItems: 70, textualOnlyItems: 47, humanReviewedSenseItems: 10, runtimeProofCandidates: 3 });
    expect(batch3.summary).toMatchObject({ items: 2205, exactSingleCandidateTextualOnly: 389, polysemyUnresolved: 1816, missingCandidateUnresolved: 0, runtimeMappings: 0 });
  });

  it('fails stale source fingerprints and duplicate ledger metadata closed through the compiler CLI', () => {
    const temp = mkdtempSync(join(tmpdir(), 'kidsplay-vocab-batch-'));
    const baseManifest = readJson(manifest2Path);

    const staleManifestPath = join(temp, 'stale-manifest.json');
    const staleLedgerPath = join(temp, 'stale-ledger.json');
    writeFileSync(staleManifestPath, JSON.stringify({
      ...baseManifest,
      source: { ...baseManifest.source, expectedSemanticFingerprint: '0'.repeat(64) }
    }), 'utf8');
    writeFileSync(staleLedgerPath, JSON.stringify({
      schemaVersion: 1,
      parentIssueRef: 76,
      generatedFilePolicy: 'rebuild_and_ignore',
      batches: [{ id: baseManifest.id, sequence: baseManifest.sequence, issueRef: baseManifest.issueRef, manifest: staleManifestPath }]
    }), 'utf8');
    expect(() => runCompiler(staleLedgerPath)).toThrow(/stale source queue/);

    const duplicateLedgerPath = join(temp, 'duplicate-ledger.json');
    writeFileSync(duplicateLedgerPath, JSON.stringify({
      schemaVersion: 1,
      parentIssueRef: 76,
      generatedFilePolicy: 'rebuild_and_ignore',
      batches: [
        { id: baseManifest.id, sequence: baseManifest.sequence, issueRef: baseManifest.issueRef, manifest: manifest2Path },
        { id: baseManifest.id, sequence: baseManifest.sequence, issueRef: baseManifest.issueRef, manifest: manifest2Path }
      ]
    }), 'utf8');
    expect(() => runCompiler(duplicateLedgerPath)).toThrow(/Duplicate review batch id|Duplicate review batch sequence|Duplicate review batch issueRef/);
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
    runCompiler();
    const manifest2 = readJson(manifest2Path);
    const manifest3 = readJson(manifest3Path);
    const first = {
      source2: sourceFingerprint(readJson(manifest2.source.snapshotPath)),
      source3: sourceFingerprint(readJson(manifest3.source.snapshotPath)),
      batch2: itemsFingerprint(readJson(manifest2.output.path).items),
      batch3: itemsFingerprint(readJson(manifest3.output.path).items)
    };
    runCompiler();
    const second = {
      source2: sourceFingerprint(readJson(manifest2.source.snapshotPath)),
      source3: sourceFingerprint(readJson(manifest3.source.snapshotPath)),
      batch2: itemsFingerprint(readJson(manifest2.output.path).items),
      batch3: itemsFingerprint(readJson(manifest3.output.path).items)
    };
    expect(second).toEqual(first);

    const liveGap = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    expect(liveGap.items).toHaveLength(0);
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const batch3 = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    const terminalSenseKeys = new Set(batch3.items.map((item: { senseKey: string }) => item.senseKey));
    expect(runtime.plans.every((plan: { senseKey: string }) => !terminalSenseKeys.has(plan.senseKey))).toBe(true);
  });
});
