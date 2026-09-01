import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const batchPath = 'content/vocabulary-visuals/batches/priority-sense-resolution-batch-001.json';

describe('#99 priority exact-sense resolution batch 001', () => {
  it('records 30 exact human selections with complete candidate trace', () => {
    const batch = readJson(batchPath);
    expect(batch).toMatchObject({
      issueRef: 99,
      parentIssueRef: 76,
      status: 'human_reviewed_exact_sense',
      policy: {
        bareLemmaMappingAllowed: false,
        definitionsIncluded: false,
        sourceGlossesIncluded: false,
        sourceExamplesIncluded: false,
        runtimeMappingCreated: false
      }
    });
    expect(batch.items).toHaveLength(30);
    expect(new Set(batch.items.map((item: { lemma: string }) => item.lemma)).size).toBe(30);

    const importedCandidates = new Set<string>();
    for (let grade = 1; grade <= 6; grade += 1) {
      const review = readJson(`content/lexicon/open/sense-review/grade-${grade}-introduced-meaning-oewn.json`);
      for (const candidate of review.candidates ?? []) importedCandidates.add(candidate.candidateId);
    }
    for (const item of batch.items) {
      expect(item.senseKey).toBe(item.sourceTrace.selectedCandidateId);
      expect(item.sourceTrace.candidateSenseCount).toBe(2);
      expect(item.sourceTrace.candidateIds).toHaveLength(2);
      expect(item.sourceTrace.candidateIds).toContain(item.sourceTrace.selectedCandidateId);
      expect(item.sourceTrace.candidateIds.every((id: string) => importedCandidates.has(id))).toBe(true);
      expect(item.maturity === 'V1' || item.maturity === 'V2').toBe(true);
    }
  });

  it('uses exact existing entities and rejects over-narrow generic pictures', () => {
    const batch = readJson(batchPath);
    const byLemma = new Map(batch.items.map((item: any) => [item.lemma, item]));
    expect([...byLemma.entries()].filter(([, item]: any) => item.strategy === 'direct_entity').map(([lemma]) => lemma).sort())
      .toEqual(['apple', 'forest', 'mountain', 'ocean', 'tree']);
    expect([...byLemma.entries()].filter(([, item]: any) => item.strategy === 'textual_only').map(([lemma]) => lemma).sort())
      .toEqual(['bear', 'boat', 'camera', 'computer', 'food', 'health']);
    expect(byLemma.get('bear')).not.toHaveProperty('visualRef');
    expect(byLemma.get('boat')).not.toHaveProperty('visualRef');

    const visualRefs = new Set<string>();
    for (const file of ['entities.json', 'everyday.json', 'nature-space.json']) {
      for (const entity of readJson(`content/visuals/${file}`)) visualRefs.add(entity.id);
    }
    for (const item of byLemma.values()) {
      if (item.strategy === 'direct_entity') expect(visualRefs.has(item.visualRef)).toBe(true);
    }
  });

  it('removes the tranche from blockers while preserving terminal accounting', () => {
    const batch = readJson(batchPath);
    const queue = readJson('content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json');
    const queued = new Set(queue.items.map((item: { lemma: string }) => item.lemma));
    for (const item of batch.items) expect(queued.has(item.lemma)).toBe(false);
    expect(queue.summary).toMatchObject({
      items: 1816,
      byRisk: { candidate_relevance: 13, high: 1304, medium: 499 },
      byStatus: { candidate_relevance_review_required: 12, human_sense_selection_required: 1804 }
    });

    const report = JSON.parse(execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    ));
    expect(report.corpus).toMatchObject({
      totalLemmas: 10000,
      terminalDispositionLemmas: 10000,
      resolvedStrategyLemmas: 617,
      blockedSenseResolutionLemmas: 9383
    });
    expect(report.meaningQueue).toMatchObject({
      totalPriorityLemmas: 2400,
      terminalDispositionLemmas: 2400,
      resolvedStrategyLemmas: 584,
      blockedSenseResolutionLemmas: 1816
    });
    expect(report.runtime).toMatchObject({ totalPlans: 26, childFacingPlans: 22, pendingProofPlans: 0 });
    expect(report.summary.errors).toBe(0);
  });

  it('creates no editorial prose, placement, or unproved runtime authority', () => {
    const batch = readJson(batchPath);
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const selected = new Set(batch.items.map((item: { senseKey: string }) => item.senseKey));
    expect((runtime.plans ?? []).every((plan: { senseKey: string }) => !selected.has(plan.senseKey))).toBe(true);

    const keys = new Set<string>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      for (const [key, nested] of Object.entries(value)) {
        keys.add(key);
        visit(nested);
      }
    };
    visit(batch);
    for (const forbidden of ['definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples', 'childDefinition', 'childExample', 'profileRef', 'knowledgeRef']) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });
});
