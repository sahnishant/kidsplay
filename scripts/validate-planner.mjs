import { formatDataForEngine } from './formatters/registry.mjs';
import { loadPlanningData } from './planning/loadPlanningData.mjs';
import { planActivities } from './planning/planner.mjs';

const { sources, index } = loadPlanningData();
const sourceById = new Map(sources.map((source) => [source.id, source]));
const request = {
  sources,
  index,
  profileRef: 'SOF_INDIA_CLASS2',
  skill: 'vocabulary',
  count: 6,
  variety: 'high',
  difficulty: 2
};
const plan = planActivities(request);
const repeatedPlan = planActivities(request);

const errors = [];
if (plan.length !== 6) errors.push(`Expected 6 planned activities, got ${plan.length}`);
if (JSON.stringify(plan) !== JSON.stringify(repeatedPlan)) errors.push('Repeated planner request did not produce deterministic output');
if (new Set(plan.map((item) => item.id)).size !== plan.length) errors.push('Planner produced duplicate recipe ids');
const engineCount = new Set(plan.map((item) => item.engine)).size;
if (engineCount < 5) errors.push(`Expected high variety across at least 5 engines, got ${engineCount}`);

const sameSet = (left, right) => left.length === right.length && left.every((value) => right.includes(value));

for (const recipe of plan) {
  const source = sourceById.get(recipe.sourceRef);
  if (!source) {
    errors.push(`${recipe.id}: missing source ${recipe.sourceRef}`);
    continue;
  }
  try {
    const result = formatDataForEngine(source, recipe.engine, recipe);
    const deliveryItems = [...(result.questions ?? []), ...(result.crosswordAuthoring ?? [])];
    if (!deliveryItems.length) errors.push(`${recipe.id}: formatter produced no delivery authoring output`);
    for (const item of deliveryItems) {
      const refs = item.knowledgeRefs ?? [];
      if (!sameSet(refs, recipe.rowIds ?? [])) errors.push(`${recipe.id}: delivery knowledgeRefs do not match planned rowIds`);
    }
  } catch (error) {
    errors.push(`${recipe.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const badRequest of [
  { ...request, profileRef: 'NOT_A_PROFILE' },
  { ...request, allowedEngines: ['not-an-engine@1'] },
  { ...request, deliveryCategory: 'mystery' },
  { ...request, difficulty: 0 }
]) {
  let rejected = false;
  try {
    planActivities(badRequest);
  } catch {
    rejected = true;
  }
  if (!rejected) errors.push(`Planner failed to reject invalid request ${JSON.stringify(badRequest)}`);
}

if (errors.length) {
  console.error(`Planner validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Planner OK: ${plan.length} deterministic recipes across ${engineCount} engines with stable row traceability and fail-fast input guards.`);
}
