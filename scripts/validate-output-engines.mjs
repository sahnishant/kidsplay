import { formatDataForEngine } from './formatters/registry.mjs';
import { getOutputEngine } from './output-engines/registry.mjs';
import { loadPlanningData } from './planning/loadPlanningData.mjs';
import { planActivities } from './planning/planner.mjs';

const { sources, index } = loadPlanningData();
const sourceById = new Map(sources.map((source) => [source.id, source]));
const plan = planActivities({
  sources,
  index,
  profileRef: 'SOF_INDIA_CLASS2',
  skill: 'vocabulary',
  count: 1,
  allowedEngines: ['print_cards@1'],
  deliveryCategory: 'output'
});

const errors = [];
if (plan.length !== 1) errors.push(`Expected one output plan, got ${plan.length}`);
const recipe = plan[0];
if (recipe) {
  const source = sourceById.get(recipe.sourceRef);
  try {
    const formatted = formatDataForEngine(source, recipe.engine, recipe);
    const contract = formatted.outputContracts?.[0];
    if (!contract) errors.push('print_cards formatter produced no output contract');
    else {
      const html = getOutputEngine(recipe.engine).render(contract);
      const searchableHtml = html.toLowerCase();
      if (contract.cards.length < 2) errors.push('expected multiple printable cards from rich association data');
      if (contract.rowIds.length !== contract.cards.length) errors.push('printable card row traceability count does not match card count');

      for (const card of contract.cards.slice(0, 3)) {
        if (!contract.rowIds.includes(card.rowId)) errors.push(`printable card ${card.id} lost row traceability`);
        for (const side of [card.front, card.back]) {
          const text = String(side?.text ?? '').trim().toLowerCase();
          if (text && !searchableHtml.includes(text)) {
            errors.push(`rendered printable cards lost source text: ${side.text}`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

if (errors.length) {
  console.error(`Output engine validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Output engine OK: profile-selected association data renders printable memory cards with row traceability.');
}
