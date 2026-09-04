import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const assetsDir = join(root, 'dist', 'assets');

const budgets = {
  maxSingleJsBytes: 700 * 1024,
  maxSingleJsGzipBytes: 140 * 1024,
  maxTotalJsBytes: 760 * 1024,
  maxCoreJsGzipBytes: 160 * 1024,
  maxCoreCssBytes: 100 * 1024
};

// Lazy product routes are bounded separately so adding an offline route does not
// silently consume the core-runtime budget. The primary/single-chunk limits stay
// unchanged and every named route must remain inside its reviewed allowance.
const lazyRouteBudgets = [
  { prefix: 'LearnAboutViewport-', maxJsGzipBytes: 9 * 1024, maxCssBytes: 2 * 1024 },
  { prefix: 'ForestWorldDepthViewport-', maxJsGzipBytes: 5 * 1024, maxCssBytes: 3 * 1024 },
  { prefix: 'FirstPlayViewport-', maxJsGzipBytes: 5 * 1024, maxCssBytes: 1 * 1024 },
  { prefix: 'StoriesViewport-', maxJsGzipBytes: 7 * 1024, maxCssBytes: 3 * 1024 },
  // Grown-up progress/assessment views are not part of the child startup path.
  // Keep them independently bounded now that Home loads them only on demand.
  { prefix: 'ProgressViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 5 * 1024 },
  { prefix: 'GoalsViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 5 * 1024 },
  // V1 deterministic spacing + eligibility + world-fit selection. Keep this
  // isolated from the core budget and below a deliberately small 2.5 KiB cap.
  { prefix: 'adaptiveRouting-', maxJsGzipBytes: 2.5 * 1024, maxCssBytes: 0 },
  { prefix: 'DiscoveryBookViewport-', maxJsGzipBytes: 8 * 1024, maxCssBytes: 4 * 1024 }
];

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function measure(name) {
  const path = join(assetsDir, name);
  const info = await stat(path);
  const bytes = info.size;
  const gzipBytes = name.endsWith('.js') ? gzipSync(await readFile(path)).byteLength : null;
  return { name, bytes, gzipBytes };
}

function routeBudgetFor(asset) {
  return lazyRouteBudgets.find((budget) => asset.name.startsWith(budget.prefix));
}

let names;
try {
  names = await readdir(assetsDir);
} catch (error) {
  console.error('Bundle budget validation failed: dist/assets is missing. Run the production build first.');
  throw error;
}

const measured = await Promise.all(
  names.filter((name) => name.endsWith('.js') || name.endsWith('.css')).sort().map(measure)
);
const js = measured.filter((asset) => asset.name.endsWith('.js'));
const css = measured.filter((asset) => asset.name.endsWith('.css'));

if (!js.length) {
  console.error('Bundle budget validation failed: production build emitted no JavaScript assets.');
  process.exit(1);
}

const largestJs = [...js].sort((left, right) => right.bytes - left.bytes)[0];
const totalJsBytes = js.reduce((sum, asset) => sum + asset.bytes, 0);
const coreJs = js.filter((asset) => !routeBudgetFor(asset));
const coreCss = css.filter((asset) => !routeBudgetFor(asset));
const coreJsGzipBytes = coreJs.reduce((sum, asset) => sum + (asset.gzipBytes ?? 0), 0);
const coreCssBytes = coreCss.reduce((sum, asset) => sum + asset.bytes, 0);
const errors = [];

if (largestJs.bytes > budgets.maxSingleJsBytes) {
  errors.push(`largest JS chunk ${largestJs.name} is ${kib(largestJs.bytes)}; budget ${kib(budgets.maxSingleJsBytes)}`);
}
if ((largestJs.gzipBytes ?? 0) > budgets.maxSingleJsGzipBytes) {
  errors.push(`largest JS chunk gzip is ${kib(largestJs.gzipBytes ?? 0)}; budget ${kib(budgets.maxSingleJsGzipBytes)}`);
}
if (totalJsBytes > budgets.maxTotalJsBytes) {
  errors.push(`total JS is ${kib(totalJsBytes)}; budget ${kib(budgets.maxTotalJsBytes)}`);
}
if (coreJsGzipBytes > budgets.maxCoreJsGzipBytes) {
  errors.push(`core JS gzip is ${kib(coreJsGzipBytes)}; budget ${kib(budgets.maxCoreJsGzipBytes)}`);
}
if (coreCssBytes > budgets.maxCoreCssBytes) {
  errors.push(`core CSS is ${kib(coreCssBytes)}; budget ${kib(budgets.maxCoreCssBytes)}`);
}

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
  if (routeJsGzipBytes > route.maxJsGzipBytes) {
    errors.push(`${route.prefix} JS gzip is ${kib(routeJsGzipBytes)}; budget ${kib(route.maxJsGzipBytes)}`);
  }
  if (routeCssBytes > route.maxCssBytes) {
    errors.push(`${route.prefix} CSS is ${kib(routeCssBytes)}; budget ${kib(route.maxCssBytes)}`);
  }
  console.log(`- ${route.prefix} route: ${kib(routeJsGzipBytes)} JS gzip / ${kib(routeCssBytes)} CSS`);
}

if (errors.length) {
  console.error('Bundle budget validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  console.error('Reduce shipped code/data or make an intentional reviewed route-budget change; do not silence the check by raising Vite warning limits.');
  process.exit(1);
}

console.log('Bundle budget validation passed.');
