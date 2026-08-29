import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];

const registry = readJson('content/learning-profiles/registry.json');
const profileIds = new Set((registry.profiles ?? []).map((profile) => profile.id));
const packFiles = readdirSync(new URL('content/packs/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();

for (const file of packFiles) {
  const pack = readJson(`content/packs/${file}`);
  const prefix = pack.id ?? file;

  if (pack.kind === 'goal_path') {
    if (!pack.profileRef) {
      errors.push(`${prefix}: goal_path requires profileRef`);
    } else if (!profileIds.has(pack.profileRef)) {
      errors.push(`${prefix}: unknown profileRef ${pack.profileRef}`);
    }
  }

  if (!pack.access || !['free', 'purchase'].includes(pack.access.type)) {
    errors.push(`${prefix}: access.type must be free or purchase`);
  }
  if (pack.access?.type === 'purchase' && !String(pack.access.productId ?? '').trim()) {
    errors.push(`${prefix}: purchase access requires productId`);
  }
}

if (errors.length) {
  console.error(`Product catalog validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Product catalog OK: ${packFiles.length} pack(s), ${profileIds.size} learning profile(s).`);
}
