import { mkdirSync, writeFileSync } from 'node:fs';
import { formatDataForEngine } from './formatters/registry.mjs';
import { getOutputEngine } from './output-engines/registry.mjs';
import { loadPlanningData } from './planning/loadPlanningData.mjs';
import { planActivities } from './planning/planner.mjs';

const root = new URL('../', import.meta.url);
const filters = Object.fromEntries(process.argv.slice(2)
  .filter((arg) => arg.startsWith('--') && arg.includes('='))
  .map((arg) => {
    const [key, ...rest] = arg.slice(2).split('=');
    return [key, rest.join('=')];
  }));

const profileRef = filters.profile ?? 'SOF_INDIA_CLASS2';
const engineKey = filters.engine ?? 'print_cards@1';
const { sources, index } = loadPlanningData();
const sourceById = new Map(sources.map((source) => [source.id, source]));
const plan = planActivities({
  sources,
  index,
  profileRef,
  skill: filters.skill,
  count: 1,
  allowedEngines: [engineKey],
  deliveryCategory: 'output',
  variety: 'high'
});

if (!plan.length) throw new Error(`No ${engineKey} output can be planned for ${profileRef}`);
const recipe = plan[0];
const source = sourceById.get(recipe.sourceRef);
if (!source) throw new Error(`Missing source ${recipe.sourceRef}`);
const formatted = formatDataForEngine(source, recipe.engine, { ...recipe, title: filters.title, cardDirection: filters.direction });
const contract = formatted.outputContracts?.[0];
if (!contract) throw new Error(`${recipe.id}: formatter produced no output contract`);
const html = getOutputEngine(engineKey).render(contract);
const outputDirectory = new URL('content/output/', root);
mkdirSync(outputDirectory, { recursive: true });
const safeProfile = profileRef.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
const outputUrl = new URL(`__generated-${safeProfile}-${engineKey.replace('@', '-v')}.html`, outputDirectory);
writeFileSync(outputUrl, html, 'utf8');
console.log(`Rendered ${contract.cards.length} printable card(s) to ${outputUrl.pathname}`);
