import { createHash } from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const manifest2Path = 'content/vocabulary-visuals/review-batches/priority-batch-002.json';
const manifest3Path = 'content/vocabulary-visuals/review-batches/priority-batch-003.json';
const manifest4Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.json';
const manifest5Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.json';
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
const portableRelative = (path: string) => relative(process.cwd(), path).replaceAll('\\', '/');
const runCompiler = (ledger = ledgerPath) => execFileSync(process.execPath, [compilerPath, `--ledger=${ledger}`], { cwd: process.cwd(), encoding: 'utf8' });
const tempRoot = () => mkdtempSync(join(process.cwd(), 'node_modules', '.tmp-kidsplay-vocab-batch-'));

const writeScenario = (name: string, manifest: any, ledgerOverrides: Partial<any> = {}) => {
  const temp = tempRoot();
  const manifestPath = join(temp, `${name}-manifest.json`);
  const ledgerScenarioPath = join(temp, `${name}-ledger.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');
  const manifestRef = portableRelative(manifestPath);
  writeFileSync(ledgerScenarioPath, JSON.stringify({
    schemaVersion: 1,
    parentIssueRef: 76,
    generatedFilePolicy: 'rebuild_and_ignore',
    batches: [{ id: manifest.id, sequence: manifest.sequence, issueRef: manifest.issueRef, manifest: manifestRef }],
    ...ledgerOverrides
  }), 'utf8');
  return portableRelative(ledgerScenarioPath);
};

describe('#94 generic semantic-vocabulary review-batch factory', () => {
  it('stores reviewed decisions in a deterministic ledger/manifests while generated projections remain rebuildable', () => {
    const ledger = readJson(ledgerPath);
    const manifest2 = readJson(manifest2Path);
    const manifest3 = readJson(manifest3Path);
    const manifest4 = readJson(manifest4Path);
    const manifest5 = readJson(manifest5Path);

    expect(ledger).toMatchObject({ schemaVersion: 1, parentIssueRef: 76, generatedFilePolicy: 'rebuild_and_ignore' });
    expect(ledger.batches.map((entry: { id: string }) => entry.id)).toEqual([
      'priority-batch-002',
      'priority-batch-003',
      'priority-sense-resolution-001',
      'priority-sense-resolution-002',
      'priority-sense-resolution-003'
    ]);
    expect(new Set(ledger.batches.map((entry: { id: string }) => entry.id)).size).toBe(ledger.batches.length);
    expect(new Set(ledger.batches.map((entry: { sequence: number }) => entry.sequence)).size).toBe(ledger.batches.length);

    expect(manifest4).toMatchObject({
      status: 'sol_max_reviewed_exact_sense',
      authority: {
        defaultKind: 'sol_max_reviewed_exact_sense',
        resolutionState: 'sol_max_resolved',
        runtimeAuthority: 'none'
      },
      reviewEvidence: {
        kind: 'sol_max_row_level_acceptance',
        pullRequest: 100,
        reviewNodeId: 'PRR_kwDOUHzR8c8AAAABLmzeeQ',
        acceptedRows: 30,
        claimsHumanEditorialReview: false
      }
    });
    expect(manifest5).toMatchObject({
      sequence: 5,
      issueRef: 106,
      status: 'sol_max_reviewed_exact_sense',
      source: {
        kind: 'reviewed_items_file',
        expectedItemCount: 18
      },
      authority: {
        defaultKind: 'sol_max_reviewed_exact_sense',
        resolutionState: 'sol_max_resolved',
        runtimeAuthority: 'none'
      },
      reviewEvidence: {
        kind: 'sol_max_row_level_acceptance',
        pullRequest: 109,
        reviewNodeId: 'PRR_kwDOUHzR8c8AAAABLo97tQ',
        reviewedSemanticHeadSha: 'c37833a9fafd8c6fc71dcd25b858e5b11b9a46c9',
        acceptedRows: 18,
        claimsHumanEditorialReview: false
      }
    });

    const serialized = JSON.stringify({ ledger, manifest2, manifest3, manifest4, manifest5 });
    for (const key of forbiddenPayloadKeys) expect(serialized).not.toContain(`\"${key}\"`);
    expect(readText('.gitignore')).toContain('content/vocabulary-visuals/batches/__generated-*.json');
    expect(readText('.gitignore')).toContain('content/vocabulary-visuals/__generated-*.json');
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

  it('fails stale source fingerprints and duplicate ledger metadata closed through the production compiler', () => {
    const baseManifest = readJson(manifest2Path);
    const staleLedger = writeScenario('stale', {
      ...baseManifest,
      source: { ...baseManifest.source, expectedSemanticFingerprint: '0'.repeat(64) }
    });
    expect(() => runCompiler(staleLedger)).toThrow(/stale source queue/);

    const temp = tempRoot();
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
    expect(() => runCompiler(portableRelative(duplicateLedgerPath))).toThrow(/Duplicate review batch id|Duplicate review batch sequence|Duplicate review batch issueRef/);

    const unsafeExclusionLedger = writeScenario(
      'unsafe-source-exclusion',
      baseManifest,
      { sourceQueueExclusions: ['../outside-generated-state.json'] }
    );
    expect(() => runCompiler(unsafeExclusionLedger)).toThrow(/sourceQueueExclusions must contain safe JSON basenames/);
  });

  it('rejects capability escalation by candidate, terminal, human-review, status and runtime-authority masquerades', () => {
    const terminal = readJson(manifest3Path);
    const candidateMasquerade = writeScenario('candidate-authority', {
      ...terminal,
      authority: { ...terminal.authority, defaultKind: 'candidate_reference' }
    });
    expect(() => runCompiler(candidateMasquerade)).toThrow(/cannot create semantic dispositions|default authority/);

    const sceneMasquerade = structuredClone(terminal);
    sceneMasquerade.terminalReview.rules[0].strategy = 'place_scene';
    expect(() => runCompiler(writeScenario('terminal-scene', sceneMasquerade))).toThrow(/cannot create strategy place_scene/);

    const v2Masquerade = structuredClone(terminal);
    v2Masquerade.defaults.maturity = 'V2';
    expect(() => runCompiler(writeScenario('terminal-v2', v2Masquerade))).toThrow(/cannot establish default maturity V2|maturity V2/);

    const missingResolution = structuredClone(terminal);
    delete missingResolution.terminalReview.rules[0].resolutionState;
    expect(() => runCompiler(writeScenario('terminal-no-resolution', missingResolution))).toThrow(/invalid resolutionStates|resolutionState/);

    const badStatus = { ...terminal, status: 'reviewed_visual_strategy' };
    expect(() => runCompiler(writeScenario('terminal-status', badStatus))).toThrow(/manifest status|does not allow/);

    const runtimeMasquerade = { ...terminal, authority: { ...terminal.authority, runtimeAuthority: 'external_proof_only' } };
    expect(() => runCompiler(writeScenario('runtime-authority', runtimeMasquerade))).toThrow(/cannot grant runtime authority/);

    const human = structuredClone(readJson(manifest2Path));
    const ask = human.reviews.find((entry: any) => entry.type === 'item' && entry.lemma === 'ask');
    ask.senseKey = 'ask#v#999';
    expect(() => runCompiler(writeScenario('false-human-review', human))).toThrow(/does not match #51 curation evidence|human authority/);

    const falseSolMax = structuredClone(readJson(manifest4Path));
    falseSolMax.reviewEvidence.reviewNodeId = 'not-a-review';
    expect(() => runCompiler(writeScenario('false-sol-max-review', falseSolMax))).toThrow(/immutable external review evidence/);
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

  it('is idempotent and remains deterministic under two concurrent production compiles', async () => {
    runCompiler();
    const manifest2 = readJson(manifest2Path);
    const manifest3 = readJson(manifest3Path);
    const manifest4 = readJson(manifest4Path);
    const manifest5 = readJson(manifest5Path);
    const fingerprintState = () => ({
      source2: sourceFingerprint(readJson(manifest2.source.snapshotPath)),
      source3: sourceFingerprint(readJson(manifest3.source.snapshotPath)),
      batch2: itemsFingerprint(readJson(manifest2.output.path).items),
      batch3: itemsFingerprint(readJson(manifest3.output.path).items),
      exactReview1: itemsFingerprint(readJson(manifest4.output.path).items),
      exactReview2: itemsFingerprint(readJson(manifest5.output.path).items)
    });
    const first = fingerprintState();
    runCompiler();
    expect(fingerprintState()).toEqual(first);

    await Promise.all([
      execFileAsync(process.execPath, [compilerPath], { cwd: process.cwd() }),
      execFileAsync(process.execPath, [compilerPath], { cwd: process.cwd() })
    ]);
    expect(fingerprintState()).toEqual(first);

    const liveGap = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    expect(liveGap.items).toHaveLength(0);
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const batch3 = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    const terminalSenseKeys = new Set(batch3.items.map((item: { senseKey: string }) => item.senseKey));
    expect(runtime.plans.every((plan: { senseKey: string }) => !terminalSenseKeys.has(plan.senseKey))).toBe(true);
  }, 30000);
});
