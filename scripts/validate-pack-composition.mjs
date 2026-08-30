import { readdirSync, readFileSync } from 'node:fs';
import { packMap, resolvePackQuestionRefs } from './learningPacks.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const packs = readdirSync(new URL('content/packs/', root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => readJson(`content/packs/${name}`))
  .filter((pack) => pack?.kind === 'learning_pack');
const byId = packMap(packs);
const errors = [];

for (const pack of packs) {
  const includes = pack.includePackRefs ?? [];
  if (!Array.isArray(includes)) {
    errors.push(`${pack.id}: includePackRefs must be an array`);
    continue;
  }
  if (new Set(includes).size !== includes.length) errors.push(`${pack.id}: duplicate includePackRefs`);
  for (const includedId of includes) {
    const included = byId.get(includedId);
    if (!included) {
      errors.push(`${pack.id}: unknown included pack ${includedId}`);
      continue;
    }
    if (includedId === pack.id) errors.push(`${pack.id}: pack cannot include itself`);
    if (pack.access?.type === 'free' && included.access?.type !== 'free') {
      errors.push(`${pack.id}: free pack cannot include non-free pack ${includedId}`);
    }
  }

  try {
    resolvePackQuestionRefs(byId, pack.id);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

if (errors.length) {
  console.error(`Pack composition failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const composed = packs.filter((pack) => (pack.includePackRefs?.length ?? 0) > 0);
  console.log(`Pack composition OK: ${packs.length} learning pack(s), ${composed.length} composed pack(s), free-access inheritance guarded.`);
}
