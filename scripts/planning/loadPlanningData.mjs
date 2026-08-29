import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const readObjects = (directory) => readdirSync(directory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(new URL(name, directory));
    return Array.isArray(value) ? value : [value];
  });

export function loadPlanningData() {
  return {
    sources: readObjects(new URL('content/knowledge/', root)),
    index: readJson(new URL('content/index/__generated-learning-index.json', root))
  };
}
