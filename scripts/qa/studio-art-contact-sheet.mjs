import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const source = 'node_modules/.cache/kidsplay-playwright/results';
const destination = 'studio-art-proof';
const visuals = JSON.parse(await readFile('content/visuals/studio-scenes.json', 'utf8'));
async function walk(path) {
  try {
    const children = await readdir(path, { withFileTypes: true });
    return (await Promise.all(children.map((child) => child.isDirectory() ? walk(join(path, child.name)) : [join(path, child.name)]))).flat();
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
const files = (await walk(source)).sort();
const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const captures = await Promise.all(visuals.map(async (visual) => {
  const matches = files.filter((path) => basename(path) === `studio-art-${visual.glyph}.png`);
  const path = matches.find((path) => !path.includes('retry')) ?? matches[0];
  if (!path) return { glyph: visual.glyph, label: visual.label, missing: true };
  const bytes = await readFile(path);
  return { glyph: visual.glyph, label: visual.label, path, hash: createHash('sha256').update(bytes).digest('hex'), image: bytes.toString('base64'), missing: false };
}));
await mkdir(destination, { recursive: true });
const missing = captures.filter((capture) => capture.missing).map((capture) => capture.glyph);
const report = { checkout: sha, complete: !missing.length, expected: visuals.length, captured: captures.length - missing.length, missing, captures: captures.map(({ image, ...capture }) => capture) };
await writeFile(join(destination, 'studio-art-capture-report.json'), JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1320, height: 1140 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>html{background:#eff2e9;color:#253c35;font-family:Arial,sans-serif}body{margin:24px}h1{font-size:25px;margin:0 0 7px}.note{font-size:13px;margin:0 0 18px}main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}figure{background:#fffef9;border:1px solid #ced8c7;border-radius:16px;padding:10px;margin:0}img,.missing{display:block;width:100%;aspect-ratio:8/5;object-fit:contain}figcaption{font-size:14px;line-height:1.3;margin-top:8px;min-height:37px}.missing{background:#edd8ce;text-align:center;display:grid;place-items:center}</style></head><body><h1>Kidsplay · Illustrated studio review</h1><p class="note">Actual browser captures · ${escape(sha.slice(0,12))} · ${report.captured}/${report.expected} captured · Candidate artwork, not human approval</p><main>${captures.map((capture) => `<figure>${capture.missing ? '<div class="missing">Capture missing</div>' : `<img src="data:image/png;base64,${capture.image}" alt="">`}<figcaption>${escape(capture.label)}</figcaption></figure>`).join('')}</main></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
  await page.screenshot({ path: join(destination, 'studio-art-contact.png'), fullPage: true });
} finally { await browser.close(); }
console.log(JSON.stringify(report, null, 2));
if (missing.length) process.exitCode = 1;
