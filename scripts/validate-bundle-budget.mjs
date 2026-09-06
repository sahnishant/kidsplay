import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const assetsDir = join(root, 'dist', 'assets');

const budgets = {
  maxSingleJsBytes: 700 * 1024,
  maxSingleJsGzipBytes: 140 * 1024,
  // Sixteen source-bound states and picture-card teaching: cdcd4f1 measures
  // 854.0 KiB installed. Explicit +32 KiB feature allowance over 832 KiB.
  // Quiet Creek visual rescue adds a bounded +3 KiB raw-JS allowance for spatial
  // placement/touch handling on the already-lazy Forest mission route.
  // MATCH-08 measured the third reusable studio family at 876.8 KiB raw. Give
  // that cross-topic family a further +12 KiB installed-code ceiling; it remains
  // subject to the lazy StudioLauncher cap below rather than becoming core code.
  // Bicycle Workshop adds one isolated interactive teaching stage. After trimming
  // duplicate mechanics UI it remains independently route-capped below; +9 KiB
  // admits that measured raw payload without changing any existing route ceiling.
  // #268 contributes a second, nested lazy teaching surface for explicit pedal /
  // crank / chain / brake progression. The integrated chunk measures ~10.6 KiB raw;
  // admit a bounded +11 KiB while keeping its own gzip/CSS route caps below.
  // See docs/studio-art-budget-review.md; other routes remain independently capped.
  maxTotalJsBytes: (784 + 32 + 16 + 32 + 3 + 12 + 9 + 11) * 1024,
  // MATCH-08 measured core at 167.2 KiB gzip; a bounded +1 KiB admission covers
  // shared drag-state typing/validation without absorbing the matching UI route.
  maxCoreJsGzipBytes: (162 + 4 + 1 + 1) * 1024,
  maxCoreCssBytes: 100 * 1024
};

// Explicit feature allowances are review items, not disabled checks.
const lazyRouteBudgets = [
  // The restored StudioLauncher split measures Learn About at ~9.34 KiB gzip.
  // Keep a narrow 9.5 KiB ceiling rather than folding the whole Studio surface back in.
  { prefix: 'LearnAboutViewport-', maxJsGzipBytes: 9.5 * 1024, maxCssBytes: 3 * 1024 },
  // This shared registry/support chunk is emitted only with the lazy Learn About /
  // Studio surfaces. It is not startup core, so account for it explicitly.
  { prefix: 'learningStudios-', maxJsGzipBytes: 5.5 * 1024, maxCssBytes: 0 },
  // MATCH-08 measured 11.4 KiB gzip / 5.6 KiB CSS after adding resumable matching,
  // source-backed Show Me pairs and actual-work accessibility. Keep it bounded at
  // 12/6; future studio families must earn another explicit review rather than
  // silently consuming this route.
  { prefix: 'StudioLauncher-', maxJsGzipBytes: 12 * 1024, maxCssBytes: 6 * 1024 },
  // STUDIO-08 is loaded only when its collection activity opens. Keep the new
  // mechanic outside startup core and independently bounded like EqualParts.
  { prefix: 'CollectionCount-', maxJsGzipBytes: 4.5 * 1024, maxCssBytes: 3 * 1024 },
  { prefix: 'StudioScene-', maxJsGzipBytes: 7 * 1024, maxCssBytes: 2 * 1024 },
  { prefix: 'studioWordProjection-', maxJsGzipBytes: 1.5 * 1024, maxCssBytes: 0 },
  { prefix: 'EqualParts-', maxJsGzipBytes: 4 * 1024, maxCssBytes: 3 * 1024 },
  { prefix: 'ForestWorldDepthViewport-', maxJsGzipBytes: 2 * 1024, maxCssBytes: 1 * 1024 },
  // Quiet Creek was deliberately rebuilt from a text/status-card screen into one
  // persistent illustrated world. This is a reviewed route-local allowance for the
  // spatial bridge/channel targets, tactile piece tray and visible cause/effect states;
  // the route remains lazy and core CSS/JS budgets are unchanged.
  { prefix: 'ForestWorldDepthMissionViewport-', maxJsGzipBytes: 6 * 1024, maxCssBytes: 12 * 1024 },
  { prefix: 'TownWorldDepthViewport-', maxJsGzipBytes: 7 * 1024, maxCssBytes: 4 * 1024 },
  { prefix: 'assemblyInteraction-', maxJsGzipBytes: 2.5 * 1024, maxCssBytes: 0 },
  { prefix: 'FirstPlayViewport-', maxJsGzipBytes: 5 * 1024, maxCssBytes: 1 * 1024 },
  { prefix: 'StoriesViewport-', maxJsGzipBytes: 7 * 1024, maxCssBytes: 3 * 1024 },
  { prefix: 'ProgressViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 5 * 1024 },
  { prefix: 'GoalsViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 5 * 1024 },
  { prefix: 'adaptiveRouting-', maxJsGzipBytes: 2.5 * 1024, maxCssBytes: 0 },
  { prefix: 'DiscoveryBookViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 4 * 1024 },
  { prefix: 'PhonicsAdventureViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 3 * 1024 },
  { prefix: 'PhonicsAudioGate-', maxJsGzipBytes: 3 * 1024, maxCssBytes: 2 * 1024 },
  // Detailed Bicycle interaction is lazy under BicycleWorkshopViewport and stays
  // independently bounded rather than becoming part of the core route budget.
  { prefix: 'BicycleStoryStage-', maxJsGzipBytes: 4 * 1024, maxCssBytes: 5 * 1024 },
  { prefix: 'BicycleWorkshopViewport-', maxJsGzipBytes: 7 * 1024, maxCssBytes: 7 * 1024 },
  // Imported from #268: the mechanism lesson is its own reusable nested surface.
  { prefix: 'BicycleMechanismDemonstration-', maxJsGzipBytes: 4.5 * 1024, maxCssBytes: 6.5 * 1024 },
  { prefix: 'bicycleWorkshopRuntime-', maxJsGzipBytes: 7 * 1024, maxCssBytes: 0 }
];

const contentAssetBudgets = [
  { prefix: 'runtime-bicycle-workshop-', expectedCount: 6, maxRawBytes: 48 * 1024, maxGzipBytes: 12 * 1024 },
  { prefix: 'runtime-fraction-studio-', expectedCount: 1, maxRawBytes: 4 * 1024, maxGzipBytes: 1.5 * 1024 },
  { prefix: 'runtime-studio-reuse-', expectedCount: 1, maxRawBytes: 6 * 1024, maxGzipBytes: 2 * 1024 },
  { prefix: 'runtime-__generated-story-studios-', expectedCount: 1, maxRawBytes: 4 * 1024, maxGzipBytes: 1.5 * 1024 }
];

function kib(bytes) { return `${(bytes / 1024).toFixed(1)} KiB`; }
async function measure(name) {
  const path = join(assetsDir, name);
  const info = await stat(path);
  const bytes = info.size;
  const gzipBytes = name.endsWith('.js') || name.endsWith('.json') ? gzipSync(await readFile(path)).byteLength : null;
  return { name, bytes, gzipBytes };
}
function routeBudgetFor(asset) { return lazyRouteBudgets.find((budget) => asset.name.startsWith(budget.prefix)); }

let names;
try { names = await readdir(assetsDir); }
catch (error) {
  console.error('Bundle budget validation failed: dist/assets is missing. Run the production build first.');
  throw error;
}
const measured = await Promise.all(names.filter((name) => name.endsWith('.js') || name.endsWith('.css') || name.endsWith('.json')).sort().map(measure));
const js = measured.filter((asset) => asset.name.endsWith('.js'));
const css = measured.filter((asset) => asset.name.endsWith('.css'));
const json = measured.filter((asset) => asset.name.endsWith('.json'));
if (!js.length) { console.error('Bundle budget validation failed: production build emitted no JavaScript assets.'); process.exit(1); }
const largestJs = [...js].sort((left, right) => right.bytes - left.bytes)[0];
const totalJsBytes = js.reduce((sum, asset) => sum + asset.bytes, 0);
const coreJs = js.filter((asset) => !routeBudgetFor(asset));
const coreCss = css.filter((asset) => !routeBudgetFor(asset));
const coreJsGzipBytes = coreJs.reduce((sum, asset) => sum + (asset.gzipBytes ?? 0), 0);
const coreCssBytes = coreCss.reduce((sum, asset) => sum + asset.bytes, 0);
const errors = [];
if (largestJs.bytes > budgets.maxSingleJsBytes) errors.push(`largest JS chunk ${largestJs.name} is ${kib(largestJs.bytes)}; budget ${kib(budgets.maxSingleJsBytes)}`);
if ((largestJs.gzipBytes ?? 0) > budgets.maxSingleJsGzipBytes) errors.push(`largest JS chunk gzip is ${kib(largestJs.gzipBytes ?? 0)}; budget ${kib(budgets.maxSingleJsGzipBytes)}`);
if (totalJsBytes > budgets.maxTotalJsBytes) errors.push(`total JS is ${kib(totalJsBytes)}; budget ${kib(budgets.maxTotalJsBytes)}`);
if (coreJsGzipBytes > budgets.maxCoreJsGzipBytes) errors.push(`core JS gzip is ${kib(coreJsGzipBytes)}; budget ${kib(budgets.maxCoreJsGzipBytes)}`);
if (coreCssBytes > budgets.maxCoreCssBytes) errors.push(`core CSS is ${kib(coreCssBytes)}; budget ${kib(budgets.maxCoreCssBytes)}`);
console.log('Production bundle budget:');
console.log(`- JS chunks: ${js.length}; largest ${kib(largestJs.bytes)} raw / ${kib(largestJs.gzipBytes ?? 0)} gzip`);
console.log(`- Total JS: ${kib(totalJsBytes)} raw; core ${kib(coreJsGzipBytes)} gzip`);
console.log(`- Core CSS: ${kib(coreCssBytes)}`);
for (const route of lazyRouteBudgets) {
  const routeJs = js.filter((asset) => asset.name.startsWith(route.prefix));
  const routeCss = css.filter((asset) => asset.name.startsWith(route.prefix));
  const routeJsGzipBytes = routeJs.reduce((sum, asset) => sum + (asset.gzipBytes ?? 0), 0);
  const routeCssBytes = routeCss.reduce((sum, asset) => sum + asset.bytes, 0);
  if (routeJs.length === 0) errors.push(`${route.prefix} lazy route emitted no JavaScript chunk`);
  if (routeJsGzipBytes > route.maxJsGzipBytes) errors.push(`${route.prefix} JS gzip is ${kib(routeJsGzipBytes)}; budget ${kib(route.maxJsGzipBytes)}`);
  if (routeCssBytes > route.maxCssBytes) errors.push(`${route.prefix} CSS is ${kib(routeCssBytes)}; budget ${kib(route.maxCssBytes)}`);
  console.log(`- ${route.prefix} route: ${kib(routeJsGzipBytes)} JS gzip / ${kib(routeCssBytes)}`);
}
for (const contentBudget of contentAssetBudgets) {
  const assets = json.filter((asset) => asset.name.startsWith(contentBudget.prefix));
  const rawBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const gzipBytes = assets.reduce((sum, asset) => sum + (asset.gzipBytes ?? 0), 0);
  if (assets.length !== contentBudget.expectedCount) errors.push(`${contentBudget.prefix} emitted ${assets.length} JSON asset(s); expected ${contentBudget.expectedCount}`);
  if (rawBytes > contentBudget.maxRawBytes) errors.push(`${contentBudget.prefix} data is ${kib(rawBytes)} raw; budget ${kib(contentBudget.maxRawBytes)}`);
  if (gzipBytes > contentBudget.maxGzipBytes) errors.push(`${contentBudget.prefix} data is ${kib(gzipBytes)} gzip; budget ${kib(contentBudget.maxGzipBytes)}`);
  console.log(`- ${contentBudget.prefix} data: ${assets.length} asset(s), ${kib(rawBytes)} raw / ${kib(gzipBytes)}`);
}
if (errors.length) {
  console.error('Bundle budget validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  console.error('Reduce shipped code/data or make an intentional reviewed route-budget change; do not silence the check by raising Vite warning limits.');
  process.exit(1);
}
console.log('Bundle budget validation passed.');
