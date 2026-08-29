import { loadPlanningData } from './planning/loadPlanningData.mjs';
import { planActivities } from './planning/planner.mjs';

const filters = Object.fromEntries(process.argv.slice(2)
  .filter((arg) => arg.startsWith('--') && arg.includes('='))
  .map((arg) => {
    const [key, ...rest] = arg.slice(2).split('=');
    return [key, rest.join('=')];
  }));

if (!filters.profile) {
  console.error('Usage: npm run plan:profile -- --profile=SOF_INDIA_CLASS2 [--skill=vocabulary] [--count=6]');
  process.exitCode = 1;
} else {
  const { sources, index } = loadPlanningData();
  const plan = planActivities({
    sources,
    index,
    profileRef: filters.profile,
    skill: filters.skill,
    knowledgeLevels: filters.levels ? filters.levels.split(',').filter(Boolean) : undefined,
    count: filters.count ? Number(filters.count) : 6,
    allowedEngines: filters.engines ? filters.engines.split(',').filter(Boolean) : undefined,
    difficulty: filters.difficulty ? Number(filters.difficulty) : 2,
    variety: filters.variety ?? 'high'
  });
  console.log(JSON.stringify(plan, null, 2));
  console.error(`Planned ${plan.length} activity recipe(s).`);
}
