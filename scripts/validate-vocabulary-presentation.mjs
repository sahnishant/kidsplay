import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compilePresentationSlice,
  createPresentationModeIndex,
  validatePresentationModeContract
} from './vocabulary-visuals/presentation-compiler.mjs';
import { assertPresentationStressMatrix } from './vocabulary-visuals/presentation-stress-matrix.mjs';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const maturityRank = (value) => {
  const match = /^V(\d+)$/.exec(String(value ?? ''));
  return match ? Number(match[1]) : -1;
};
const histogram = (values) => {
  const result = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
};
const repoPath = (absolutePath) => relative(rootPath, absolutePath).split(sep).join('/');

function resolveRelativeImport(fromPath, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(fromPath), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.svelte`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.json`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.js'),
    resolve(base, 'index.mjs')
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function collectTransitivePresentationDependencies(entryPaths) {
  const queue = entryPaths.map((path) => resolve(rootPath, path));
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const source = readFileSync(current, 'utf8');
    const patterns = [
      /\b(?:import|export)\s+(?:type\s+)?(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g,
      /\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/g
    ];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        const resolved = resolveRelativeImport(current, match[1]);
        if (resolved && !visited.has(resolved)) queue.push(resolved);
      }
    }
  }
  return [...visited].map(repoPath).sort();
}

const registry = readJson('content/vocabulary-visuals/registry.json');
const contract = readJson('content/vocabulary-visuals/presentation-modes.json');
const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
const strategyIds = (registry.strategies ?? []).map((entry) => entry.id);
const errors = validatePresentationModeContract(contract, strategyIds);

const batchNames = readdirSync(new URL('content/vocabulary-visuals/batches/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const items = [];
const seenSenseKeys = new Set();
for (const name of batchNames) {
  const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
  for (const item of batch.items ?? []) {
    const senseKey = String(item?.senseKey ?? '').trim();
    if (!senseKey) {
      errors.push(`${name}: visual strategy item is missing senseKey`);
      continue;
    }
    if (seenSenseKeys.has(senseKey)) {
      errors.push(`${name}: duplicate visual presentation source sense ${senseKey}`);
      continue;
    }
    seenSenseKeys.add(senseKey);
    items.push(item);
  }
}

const runtimePlans = runtime.plans ?? [];
for (const plan of runtimePlans) {
  if (!seenSenseKeys.has(plan.senseKey)) errors.push(`${plan.senseKey}: runtime plan has no strategy source item`);
}

if (errors.length === 0) {
  const modeIndex = createPresentationModeIndex(contract, strategyIds);
  const requestedRuntimeSenseKeys = [...new Set(runtimePlans.map((plan) => plan.senseKey))];
  const first = compilePresentationSlice({
    items,
    requestedSenseKeys: requestedRuntimeSenseKeys,
    contract,
    runtimePlans
  });
  const second = compilePresentationSlice({
    items,
    requestedSenseKeys: [...requestedRuntimeSenseKeys].reverse(),
    contract,
    runtimePlans
  });

  if (JSON.stringify(first) !== JSON.stringify(second)) {
    errors.push('visual presentation slice is not deterministic across request ordering');
  }

  const expectedChildFacingSenseKeys = new Set(
    runtimePlans
      .filter((plan) => plan.runtimeUsage === 'knowledge_reinforcement' && ['V5', 'V6'].includes(plan.maturity))
      .map((plan) => plan.senseKey)
  );
  const expectedChildFacingMappings = runtimePlans.filter((plan) =>
    plan.runtimeUsage === 'knowledge_reinforcement' && ['V5', 'V6'].includes(plan.maturity)
  ).length;
  if (first.summary.childFacing !== expectedChildFacingSenseKeys.size) {
    errors.push(
      `child-facing semantic-sense projection drift: expected ${expectedChildFacingSenseKeys.size}, compiled ${first.summary.childFacing}`
    );
  }
  if (first.summary.runtimeMappings !== runtimePlans.length) {
    errors.push(
      `runtime mapping accounting drift: expected ${runtimePlans.length}, compiled ${first.summary.runtimeMappings}`
    );
  }
  if (first.plans.some((plan) =>
    plan.childFacing && ['sense_unresolved', 'textual_only'].includes(plan.strategy)
  )) {
    errors.push('blocked semantic strategies reached the child-facing visual projection');
  }

  const presentationDependencies = collectTransitivePresentationDependencies([
    'src/presentation/vocabularyPresentation.ts',
    'src/presentation/VisualMeaningPresenter.svelte'
  ]);
  const forbiddenDependencyPrefixes = [
    'content/lexicon/open/',
    'content/lexicon/reviews/',
    'content/vocabulary-visuals/batches/',
    'content/vocabulary-visuals/review-batches/'
  ];
  for (const dependency of presentationDependencies) {
    if (forbiddenDependencyPrefixes.some((prefix) => dependency.startsWith(prefix))) {
      errors.push(`browser visual meaning presentation transitively imports forbidden editorial/control-plane data: ${dependency}`);
    }
  }

  const sourceStrategies = histogram(items.map((item) => item.strategy));
  const sourceDerivedModes = histogram(items.map((item) => modeIndex.get(item.strategy) ?? 'missing'));
  const sourceMaturities = histogram(items.map((item) => item.maturity));
  const sourceV1Plus = items.filter((item) => maturityRank(item.maturity) >= 1).length;
  const unresolvedSource = items.filter((item) => item.strategy === 'sense_unresolved').length;
  const textualOnlySource = items.filter((item) => item.strategy === 'textual_only').length;
  const runtimeV3Plus = new Set(
    runtimePlans.filter((plan) => maturityRank(plan.maturity) >= 3).map((plan) => plan.senseKey)
  ).size;
  const runtimeV5Plus = new Set(
    runtimePlans.filter((plan) => maturityRank(plan.maturity) >= 5).map((plan) => plan.senseKey)
  ).size;

  const stress = assertPresentationStressMatrix({
    items,
    runtimePlans,
    contract,
    cycles: 24
  });

  console.log('Vocabulary visual presentation scale report');
  console.log(`- semantic strategy source items: ${items.length}`);
  console.log(`- source strategy distribution: ${JSON.stringify(sourceStrategies)}`);
  console.log(`- source derived-mode distribution: ${JSON.stringify(sourceDerivedModes)}`);
  console.log(`- source maturity distribution: ${JSON.stringify(sourceMaturities)}`);
  console.log(`- source V1+ strategy records: ${sourceV1Plus}`);
  console.log(`- source unresolved senses: ${unresolvedSource}`);
  console.log(`- source textual-only senses: ${textualOnlySource}`);
  console.log(`- bounded runtime sense slice: ${first.summary.requested}`);
  console.log(`- runtime knowledge/template mappings represented: ${first.summary.runtimeMappings}`);
  console.log(`- runtime V3+ semantic senses: ${runtimeV3Plus}`);
  console.log(`- runtime V5+ semantic senses: ${runtimeV5Plus}`);
  console.log(`- child-facing proven semantic senses: ${first.summary.childFacing}`);
  console.log(`- child-facing knowledge mappings: ${expectedChildFacingMappings}`);
  console.log(`- renderer-ready semantic senses: ${first.summary.rendererReady}`);
  console.log(`- safe text fallbacks in runtime slice: ${first.summary.textFallback}`);
  console.log(`- derived modes: ${JSON.stringify(first.summary.derivedModes)}`);
  console.log(`- delivery modes: ${JSON.stringify(first.summary.deliveryModes)}`);
  console.log(`- compact slice payload: ${first.summary.payloadBytes} byte(s) / ${first.summary.maxPayloadBytes} max`);
  console.log(`- maximum requested senses per slice: ${first.summary.maxRequestedSenses}`);
  console.log(`- transitive browser presentation dependencies checked: ${presentationDependencies.length}`);
  console.log(`- 24 x 5 stress matrix: ${stress.passedChecks}/${stress.totalChecks} checks passed`);
  console.log('- deterministic request-order rebuild: yes');
}

if (errors.length) {
  console.error(`Vocabulary presentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Vocabulary presentation validation passed.');
