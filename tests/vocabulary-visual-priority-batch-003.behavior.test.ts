import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

const forbiddenEditorialFields = ['definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples', 'childDefinition', 'childExample'];

describe('#93 priority Phase B terminal visual dispositions', () => {
  it('assigns exactly one conservative terminal V1 disposition to every pre-batch-003 priority gap lemma', () => {
    const source = readJson('content/vocabulary-visuals/__generated-priority-gap-pre-batch-003.json');
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');

    expect(source).toMatchObject({
      schemaVersion: 1,
      issueRef: 93,
      sourceQueueIssueRef: 88,
      parentIssueRef: 76,
      status: 'generated_review_queue_pre_batch_003'
    });
    expect(source.items.length).toBeGreaterThan(2000);
    expect(batch).toMatchObject({
      schemaVersion: 1,
      issueRef: 93,
      parentIssueRef: 76,
      status: 'reviewed_terminal_visual_disposition',
      policy: {
        bareLemmaMappingAllowed: false,
        definitionsIncluded: false,
        sourceGlossesIncluded: false,
        sourceExamplesIncluded: false,
        profilePlacementInferred: false,
        runtimeMappingCreated: false,
        v2OrHigherMaturityCreated: false,
        multiCandidateSenseSelectionAllowed: false
      }
    });
    expect(batch.items).toHaveLength(source.items.length);
    expect(new Set(batch.items.map((item: { lemma: string }) => item.lemma)).size).toBe(batch.items.length);
    expect(batch.items.every((item: { maturity: string; sceneTemplate?: string; visualRef?: string; motionPolicy: string }) =>
      item.maturity === 'V1' && item.motionPolicy === 'none' && !item.sceneTemplate && !item.visualRef
    )).toBe(true);
  });

  it('preserves the exact pinned candidate only for single-candidate rows and fails polysemy closed', () => {
    const source = readJson('content/vocabulary-visuals/__generated-priority-gap-pre-batch-003.json');
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    const byLemma = new Map(batch.items.map((item: any) => [item.lemma, item]));

    let exactSingle = 0;
    let unresolved = 0;
    for (const candidate of source.items) {
      const item = byLemma.get(candidate.lemma) as any;
      expect(item).toBeTruthy();
      expect(item.sourceTrace).toMatchObject({
        sourceCorpusId: candidate.sourceCorpusId,
        grade: candidate.grade,
        candidateSenseCount: candidate.candidateSenseCount,
        candidateIds: candidate.candidateIds,
        polysemyRisk: candidate.polysemyRisk
      });

      if (candidate.candidateSenseCount === 1) {
        exactSingle += 1;
        expect(item).toMatchObject({
          senseKey: candidate.candidateIds[0],
          strategy: 'textual_only',
          reviewSource: 'single_candidate_terminal_text_only',
          answerSafety: 'neutral_safe'
        });
      } else {
        unresolved += 1;
        expect(item).toMatchObject({
          senseKey: `${candidate.lemma}#unresolved`,
          strategy: 'sense_unresolved',
          answerSafety: 'explanation_only'
        });
        expect(candidate.candidateIds).not.toContain(item.senseKey);
      }
    }

    expect(batch.summary.exactSingleCandidateTextualOnly).toBe(exactSingle);
    expect(batch.summary.polysemyUnresolved + batch.summary.missingCandidateUnresolved).toBe(unresolved);
    expect(exactSingle).toBeGreaterThan(300);
    expect(unresolved).toBeGreaterThan(1700);
  });

  it('copies no editorial prose and creates no presentation/runtime authority', () => {
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    for (const item of batch.items) {
      for (const field of forbiddenEditorialFields) expect(Object.hasOwn(item, field)).toBe(false);
      expect(item.sceneTemplate).toBeUndefined();
      expect(item.visualRef).toBeUndefined();
      expect(item.parameters).toBeUndefined();
    }
    expect(batch.summary).toMatchObject({ sceneStrategyItems: 0, directVisualItems: 0, runtimeMappings: 0 });
  });

  it('closes the 2,400-item priority meaning accounting without admitting batch-003 senses to runtime', () => {
    const liveGap = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    expect(liveGap.items).toHaveLength(0);

    const batchSenseKeys = new Set(batch.items.map((item: { senseKey: string }) => item.senseKey));
    expect((runtime.plans ?? []).every((plan: { senseKey: string }) => !batchSenseKeys.has(plan.senseKey))).toBe(true);

    const output = execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    const report = JSON.parse(output);
    expect(report.meaningQueue.totalPriorityLemmas).toBe(2400);
    expect(report.meaningQueue.auditedLemmas).toBe(2400);
    expect(report.meaningQueue.auditedLemmaPercent).toBe(100);
    expect(report.runtime.pendingProofPlans).toBe(0);
    expect(report.runtime.childFacingPlans).toBeGreaterThan(0);
    expect(report.summary.errors).toBe(0);
  });
});
