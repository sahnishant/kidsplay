import { readFileSync, readdirSync } from 'node:fs';
import {
  compilePresentationSlice,
  validatePresentationModeContract
} from './vocabulary-visuals/presentation-compiler.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const registry = readJson('content/vocabulary-visuals/registry.json');
const contract = readJson('content/vocabulary-visuals/presentation-modes.json');
const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
const errors = validatePresentationModeContract(
  contract,
  (registry.strategies ?? []).map((entry) => entry.id)
);

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

  const expectedChildFacing = runtimePlans.filter((plan) =>
    plan.runtimeUsage === 'knowledge_reinforcement' && ['V5', 'V6'].includes(plan.maturity)
  ).length;
  if (first.summary.childFacing !== expectedChildFacing) {
    errors.push(
      `child-facing visual projection drift: expected ${expectedChildFacing}, compiled ${first.summary.childFacing}`
    );
  }
  if (first.plans.some((plan) =>
    plan.childFacing && ['sense_unresolved', 'textual_only'].includes(plan.strategy)
  )) {
    errors.push('blocked semantic strategies reached the child-facing visual projection');
  }

  const browserPresenter = readFileSync(new URL('src/presentation/vocabularyPresentation.ts', root), 'utf8');
  for (const forbidden of ['primary-grade-corpus.json', 'review-batches/', 'sense-review/']) {
    if (browserPresenter.includes(forbidden)) {
      errors.push(`browser visual meaning presenter must not import ${forbidden}`);
    }
  }

  console.log('Vocabulary visual presentation scale report');
  console.log(`- semantic strategy source items: ${items.length}`);
  console.log(`- bounded runtime sense slice: ${first.summary.requested}`);
  console.log(`- child-facing proven visuals: ${first.summary.childFacing}`);
  console.log(`- renderer-ready plans: ${first.summary.rendererReady}`);
  console.log(`- safe text fallbacks in runtime slice: ${first.summary.textFallback}`);
  console.log(`- derived modes: ${JSON.stringify(first.summary.derivedModes)}`);
  console.log(`- delivery modes: ${JSON.stringify(first.summary.deliveryModes)}`);
  console.log(`- compact slice payload: ${first.summary.payloadBytes} byte(s)`);
  console.log('- deterministic request-order rebuild: yes');
}

if (errors.length) {
  console.error(`Vocabulary presentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Vocabulary presentation validation passed.');
