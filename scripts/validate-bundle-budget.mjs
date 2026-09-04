import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const assetsDir = join(root, 'dist', 'assets');

const budgets = {
  maxSingleJsBytes: 700 * 1024,
  maxSingleJsGzipBytes: 140 * 1024,
  maxTotalJsBytes: 760 * 1024,
  // Learn About V1 is a lazily loaded product route (~8 KiB gzip). Keep the
  // primary/single-chunk limit unchanged while accounting for that bounded route.
  maxTotalJsGzipBytes: 164 * 1024,
  maxTotalCssBytes: 100 * 1024
};

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
const totalJsGzipBytes = js.reduce((sum, asset) => sum + (asset.gzipBytes ?? 0), 0);
const totalCssBytes = css.reduce((sum, asset) => sum + asset.bytes, 0);
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
if (totalJsGzipBytes > budgets.maxTotalJsGzipBytes) {
  errors.push(`total JS gzip is ${kib(totalJsGzipBytes)}; budget ${kib(budgets.maxTotalJsGzipBytes)}`);
}
if (totalCssBytes > budgets.maxTotalCssBytes) {
  errors.push(`total CSS is ${kib(totalCssBytes)}; budget ${kib(budgets.maxTotalCssBytes)}`);
}

console.log('Production bundle budget:');
console.log(`- JS chunks: ${js.length}; largest ${kib(largestJs.bytes)} raw / ${kib(largestJs.gzipBytes ?? 0)} gzip`);
console.log(`- Total JS: ${kib(totalJsBytes)} raw / ${kib(totalJsGzipBytes)} gzip`);
console.log(`- Total CSS: ${kib(totalCssBytes)}`);

if (errors.length) {
  console.error('Bundle budget validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  console.error('Reduce shipped code/data or make an intentional reviewed budget change; do not silence the check by raising Vite warning limits.');
  process.exit(1);
}

console.log('Bundle budget validation passed.');
