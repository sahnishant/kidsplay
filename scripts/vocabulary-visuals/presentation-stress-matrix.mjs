import { compilePresentationSlice } from './presentation-compiler.mjs';

const PRESENTATION_MODES = new Set(['asset', 'compose', 'compare', 'transition', 'scene', 'text']);
const BLOCKED_STRATEGIES = new Set(['sense_unresolved', 'textual_only']);

const text = (value) => String(value ?? '').trim();
const maturityRank = (value) => {
  const match = /^V(\d+)$/.exec(String(value ?? ''));
  return match ? Number(match[1]) : -1;
};

function canonicalItems(items) {
  if (!Array.isArray(items)) throw new Error('Presentation stress matrix requires items[]');
  const sorted = [...items].sort((left, right) => text(left?.senseKey).localeCompare(text(right?.senseKey)));
  const seen = new Set();
  for (const item of sorted) {
    const senseKey = text(item?.senseKey);
    if (!senseKey) throw new Error('Presentation stress matrix source item is missing senseKey');
    if (seen.has(senseKey)) throw new Error(`${senseKey}: duplicate presentation stress source item`);
    seen.add(senseKey);
  }
  return sorted;
}

function partitionRoundRobin(items, cycleCount) {
  const cycles = Array.from({ length: cycleCount }, () => []);
  items.forEach((item, index) => cycles[index % cycleCount].push(item));
  return cycles;
}

function checkExactSense(items) {
  return items.every((item) => {
    const lemma = text(item?.lemma);
    const senseKey = text(item?.senseKey);
    return Boolean(lemma && senseKey.startsWith(`${lemma}#`) && senseKey.length > lemma.length + 1);
  });
}

function checkModes(slice) {
  return slice.plans.every((plan) =>
    PRESENTATION_MODES.has(plan.derivedMode) &&
    PRESENTATION_MODES.has(plan.deliveryMode) &&
    (!BLOCKED_STRATEGIES.has(plan.strategy) || plan.deliveryMode === 'text')
  );
}

function checkAuthority(slice) {
  return slice.plans.every((plan) => {
    if (BLOCKED_STRATEGIES.has(plan.strategy) && (plan.rendererReady || plan.childFacing)) return false;
    if (!plan.childFacing) return true;
    return plan.runtimeUsage === 'knowledge_reinforcement' && maturityRank(plan.effectiveMaturity) >= 5;
  });
}

function checkReuse(forward, reverse) {
  if (JSON.stringify(forward) !== JSON.stringify(reverse)) return false;
  return forward.plans.every((plan) =>
    plan.presentationKey === `visual-meaning:v${plan.compilerVersion}:${plan.senseKey}`
  );
}

function checkScale(slice, contract) {
  return slice.summary.requested <= contract.slicePolicy.maxRequestedSenses &&
    slice.summary.payloadBytes <= contract.slicePolicy.maxPayloadBytes;
}

export function buildPresentationStressMatrix({
  items,
  runtimePlans = [],
  contract,
  cycles = 24
}) {
  if (!contract) throw new Error('Presentation stress matrix requires a presentation contract');
  if (!Number.isInteger(cycles) || cycles < 1) throw new Error('Presentation stress matrix cycles must be a positive integer');
  if (!Array.isArray(runtimePlans)) throw new Error('Presentation stress matrix requires runtimePlans[]');

  const sourceItems = canonicalItems(items);
  const partitions = partitionRoundRobin(sourceItems, cycles);
  const results = partitions.map((cycleItems, index) => {
    const senseKeys = cycleItems.map((item) => item.senseKey);
    const forward = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: senseKeys,
      contract,
      runtimePlans
    });
    const reverse = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: [...senseKeys].reverse(),
      contract,
      runtimePlans
    });

    const checks = {
      sense: checkExactSense(cycleItems),
      mode: checkModes(forward),
      authority: checkAuthority(forward),
      reuse: checkReuse(forward, reverse),
      scale: checkScale(forward, contract)
    };
    return {
      cycle: index + 1,
      sourceItems: cycleItems.length,
      runtimeMappings: forward.summary.runtimeMappings,
      childFacing: forward.summary.childFacing,
      rendererReady: forward.summary.rendererReady,
      payloadBytes: forward.summary.payloadBytes,
      checks
    };
  });

  const totalChecks = results.length * 5;
  const passedChecks = results.reduce(
    (sum, result) => sum + Object.values(result.checks).filter(Boolean).length,
    0
  );

  return {
    cycles: results.length,
    disciplinesPerCycle: 5,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    allPassed: passedChecks === totalChecks,
    sourceItems: sourceItems.length,
    results
  };
}

export function assertPresentationStressMatrix(options) {
  const matrix = buildPresentationStressMatrix(options);
  if (!matrix.allPassed) {
    const failures = matrix.results.flatMap((result) =>
      Object.entries(result.checks)
        .filter(([, passed]) => !passed)
        .map(([discipline]) => `cycle ${result.cycle} / ${discipline}`)
    );
    throw new Error(`Visual presentation stress matrix failed: ${failures.join(', ')}`);
  }
  return matrix;
}
