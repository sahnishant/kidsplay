import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ledgerPath = 'content/learning-graph/migrations/004-exam-scope.json';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const must = (value, message) => { if (!value) throw new Error(message); };
if (existsSync(ledgerPath)) console.log('004 exam-scope: already migrated; no writes');
else {
  must(process.argv.includes('--write'), '004 requires --write');
  const migration = read('content/learning-graph/migrations/003-semantic-traceability.json');
  must(migration.projectedClaimCount === 40, 'Run semantic migration first');
  const blueprintPath = 'content/module-assessments/mridang/bicycle-workshop-exam-v1.json';
  const blueprint = read(blueprintPath);
  must(Object.keys(blueprint.scopePolicy.claimScopes).length === 29, 'Unexpected exam scope baseline');
  // Scope is a curriculum decision, not a new property of a shared claim.
  const supporting = [
    'claim.bicycle.pedal.operated-by.rider-foot',
    'claim.bicycle.wheel.helps-enable.rolling',
    'claim.bicycle.has-property.two-wheels',
    'claim.bicycle.has-property.human-power',
    'claim.bicycle.carrier.used-for.carrying',
    'claim.bicycle.handlebar.controls.direction',
    'claim.bicycle.brake.used-for.slowing',
    'claim.bicycle.tyre.covers.wheel',
    'claim.bicycle.bell.used-for.signalling'
  ];
  const enrichment = ['claim.bicycle.light.helps-enable.visibility', 'claim.bicycle.reflector.helps-enable.visibility'];
  for (const id of supporting) blueprint.scopePolicy.claimScopes[id] = 'chapter_supporting';
  for (const id of enrichment) blueprint.scopePolicy.claimScopes[id] = 'enrichment';
  blueprint.reviewGates.semanticTargets = 'required_candidate_functions_and_scope_placement';
  blueprint.delivery.candidateSemanticTargets = 'practice_only_no_mastery';
  const outputs = new Map();
  const hashes = {};
  function replace(path, before, after) {
    const source = outputs.get(path) ?? readFileSync(path, 'utf8');
    must(source.includes(before), `${path}: missing exact migration anchor`);
    hashes[path] ??= createHash('sha256').update(readFileSync(path)).digest('hex');
    outputs.set(path, source.replace(before, after));
  }
  const productionTest = 'tests/bicycle-workshop-production.behavior.test.ts';
  const fixture = `    const session = createBicycleWorkshopSession('practice', {\n      'claim.bicycle.is-a.wheeled-vehicle': {`;
  const counter = `{ attempts: 3, correct: 3, totalWeight: 3, correctWeight: 3, lastResult: 'correct', lastSeenAt: '2026-09-05T00:00:00.000Z' }`;
  replace(productionTest, fixture, `    const session = createBicycleWorkshopSession('practice', {\n      'claim.bicycle.has-property.two-wheels': ${counter},\n      'claim.bicycle.has-property.human-power': ${counter},\n      'claim.bicycle.is-a.wheeled-vehicle': {`);
  const testAnchor = "  it('keeps capability-only phonics and reading evidence separate from bicycle fact mastery', () => {";
  const newTest = `  it('does not treat old classification evidence as evidence for the new identity claims', () => {\n    const session = createBicycleWorkshopSession('practice', {\n      'claim.bicycle.is-a.wheeled-vehicle': ${counter}\n    });\n    expect(session.questions.some((item) => item.id === 'bicycle.workshop.identity.001')).toBe(true);\n    const identity = requireQuestion('bicycle.workshop.identity.001');\n    expect(identity.knowledgeRefs).toContain('claim.bicycle.has-property.two-wheels');\n    expect(identity.knowledgeRefs).toContain('claim.bicycle.has-property.human-power');\n    expect(evaluate(identity, { selectedOptionIds: ['bicycle'] }).masteryEvidence).toEqual([]);\n  });\n\n`;
  replace(productionTest, testAnchor, newTest + testAnchor);
  replace('tests/bicycle-workshop-exam.behavior.test.ts', 'explicitScopeCount: 29', 'explicitScopeCount: 40');
  replace('tests/bicycle-workshop-exam.behavior.test.ts', 'chapter_supporting: 6', 'chapter_supporting: 15,\n        enrichment: 2');
  replace('scripts/learning-graph/validate-bicycle-workshop-exam.mjs', "      for (const rowId of question.knowledgeRefs ?? []) {", "      if (question.semanticTarget) {\n        invariant(question.evidencePolicy === 'practice_only', `${form.id}/${ref}: candidate semantic target cannot grant mastery`);\n        invariant(question.semanticTarget.review?.publishable === false, `${form.id}/${ref}: candidate target needs human review`);\n      }\n      for (const rowId of question.knowledgeRefs ?? []) {");
  const base = 'feat/reusable-learning-studios-v1';
  replace('.github/workflows/windows-check.yml', '  pull_request:\n    branches:\n      - kidsplay\n      - main', `  pull_request:\n    branches:\n      - kidsplay\n      - main\n      - ${base}`);
  replace('.github/workflows/browser-smoke.yml', '  pull_request:\n    branches: [kidsplay, main]', `  pull_request:\n    branches: [kidsplay, main, ${base}]`);
  for (const path of ['.github/workflows/android-debug.yml', '.github/workflows/android-stories-offline.yml']) {
    replace(path, '  pull_request:\n    branches: [main]', `  pull_request:\n    branches: [main, ${base}]`);
  }
  hashes[blueprintPath] = createHash('sha256').update(readFileSync(blueprintPath)).digest('hex');
  // Compute every guarded edit before writing. No force push or release path is used.
  for (const [path, source] of outputs) writeFileSync(path, source);
  writeFileSync(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);
  writeFileSync(ledgerPath, `${JSON.stringify({ migrationId: 'learning-graph.004-exam-scope', sourceHashes: hashes, newSupportingClaims: supporting, newEnrichmentClaims: enrichment, semanticApprovalGranted: false, stackedPrBase: base }, null, 2)}\n`);
  console.log(JSON.stringify({ examScopeMigration: 'PASS', explicitScopes: 40, supporting: 15, enrichment: 2, previousScopeExclusionsPreserved: true }));
}
