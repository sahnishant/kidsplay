import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCanonicalGraph, validateCanonicalGraph } from './canonical-graph.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export function validateBicycleWorkshopGraph() {
  return validateCanonicalGraph(loadCanonicalGraph({ root: ROOT }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = validateBicycleWorkshopGraph();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.graphId}: ${result.nodeCount} nodes and ${result.claimCount} canonical claims.`);
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
