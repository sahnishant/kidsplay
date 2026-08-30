import { readFileSync } from 'node:fs';
import { getFormatterCapabilities } from './formatters/registry.mjs';
import { getNormalizerDataTypes } from './normalizers/registry.mjs';
import { getOutputEngineKeys } from './output-engines/registry.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readText = (path) => readFileSync(new URL(path, root), 'utf8');
const errors = [];

const manifest = readJson('content/engines/manifest.json');
const dataTypeRegistry = readJson('content/data-types/registry.json');
if (manifest.schemaVersion !== 1) errors.push('Engine manifest must use schemaVersion 1');
if (dataTypeRegistry.schemaVersion !== 1) errors.push('Datatype registry must use schemaVersion 1');
const engines = manifest.engines ?? [];
const engineByKey = new Map();

for (const engine of engines) {
  if (!engine?.key || !engine?.id || !Number.isInteger(engine.version)) { errors.push('Every engine manifest entry requires key, id and integer version'); continue; }
  const expectedKey = `${engine.id}@${engine.version}`;
  if (engine.key !== expectedKey) errors.push(`${engine.key}: expected key ${expectedKey}`);
  if (engineByKey.has(engine.key)) errors.push(`Duplicate engine manifest key ${engine.key}`);
  engineByKey.set(engine.key, engine);
  if (!['interactive', 'output'].includes(engine.category)) errors.push(`${engine.key}: unsupported category ${engine.category}`);
  if (typeof engine.runtime !== 'boolean') errors.push(`${engine.key}: runtime must be an explicit boolean`);
  if (engine.category === 'interactive') {
    if (!engine.interactionType) errors.push(`${engine.key}: interactive engine requires interactionType`);
    if (!engine.solutionType) errors.push(`${engine.key}: interactive engine requires solutionType`);
    if (engine.interactionType && engine.id !== engine.interactionType) {
      errors.push(`${engine.key}: interactive engine id must match interactionType ${engine.interactionType}`);
    }
    if (engine.runtime !== true) errors.push(`${engine.key}: shipped interactive engine must declare runtime true`);
  }
  if (engine.category === 'output') {
    if (!engine.contractType) errors.push(`${engine.key}: output engine requires contractType`);
    if (engine.runtime !== false) errors.push(`${engine.key}: output engine must declare runtime false`);
  }
}

const dataTypeKeys = new Set();
for (const dataType of dataTypeRegistry.dataTypes ?? []) {
  if (!dataType?.id || !Number.isInteger(dataType.version)) {
    errors.push('Every datatype registry entry requires id and integer version');
    continue;
  }
  const key = `${dataType.id}@${dataType.version}`;
  if (dataTypeKeys.has(key)) errors.push(`Duplicate datatype ${key}`);
  dataTypeKeys.add(key);
  const declaredEngines = dataType.compatibleEngines ?? [];
  if (new Set(declaredEngines).size !== declaredEngines.length) errors.push(`${key}: duplicate compatibleEngines entry`);
  for (const engineKey of declaredEngines) if (!engineByKey.has(engineKey)) errors.push(`${key}: unknown compatible engine ${engineKey}`);
  for (const engineKey of Object.keys(dataType.engineRequirements ?? {})) if (!declaredEngines.includes(engineKey)) errors.push(`${key}: requirements exist for undeclared engine ${engineKey}`);
}

const normalizerKeys = new Set(getNormalizerDataTypes());
for (const key of dataTypeKeys) if (!normalizerKeys.has(key)) errors.push(`${key}: missing datatype normalizer`);
for (const key of normalizerKeys) if (!dataTypeKeys.has(key)) errors.push(`${key}: normalizer exists without datatype registry entry`);

const formatterCapabilities = getFormatterCapabilities();
for (const key of dataTypeKeys) {
  const definition = (dataTypeRegistry.dataTypes ?? []).find((item) => `${item.id}@${item.version}` === key);
  const declared = new Set(definition?.compatibleEngines ?? []);
  const implemented = new Set(formatterCapabilities[key] ?? []);
  for (const engineKey of declared) if (!implemented.has(engineKey)) errors.push(`${key}: formatter missing declared edge ${engineKey}`);
  for (const engineKey of implemented) if (!declared.has(engineKey)) errors.push(`${key}: formatter implements undeclared edge ${engineKey}`);
}
for (const key of Object.keys(formatterCapabilities)) if (!dataTypeKeys.has(key)) errors.push(`${key}: formatter exists without datatype registry entry`);

const interactiveRuntimeKeys = engines.filter((engine) => engine.category === 'interactive' && engine.runtime === true).map((engine) => engine.key);
const runtimeSource = readText('src/runtime/engineRegistry.ts');
const runtimeBlock = runtimeSource.match(/const engines = new Map<[^>]+>\(\[([\s\S]*?)\]\);/);
if (!runtimeBlock) errors.push('Could not inspect src/runtime/engineRegistry.ts engine map');
else {
  const runtimeKeys = [...runtimeBlock[1].matchAll(/\['([^']+@\d+)',\s*[A-Za-z0-9_]+\]/g)].map((match) => match[1]);
  const runtimeSet = new Set(runtimeKeys);
  if (runtimeSet.size !== runtimeKeys.length) errors.push('Runtime engine registry contains duplicate engine keys');
  for (const key of interactiveRuntimeKeys) if (!runtimeSet.has(key)) errors.push(`${key}: manifest runtime engine missing from runtime registry`);
  for (const key of runtimeSet) if (!interactiveRuntimeKeys.includes(key)) errors.push(`${key}: runtime registry entry missing from interactive runtime manifest`);
}

const outputManifestKeys = engines.filter((engine) => engine.category === 'output').map((engine) => engine.key);
const outputRegistryKeys = getOutputEngineKeys();
for (const key of outputManifestKeys) if (!outputRegistryKeys.includes(key)) errors.push(`${key}: manifest output engine missing from output registry`);
for (const key of outputRegistryKeys) if (!outputManifestKeys.includes(key)) errors.push(`${key}: output registry entry missing from manifest`);

const validatorSource = readText('scripts/validate-content.mjs');
const validatorBlock = validatorSource.match(/const supportedEngines = new Set\(\[([\s\S]*?)\]\);/);
if (!validatorBlock) errors.push('Could not inspect validate-content supportedEngines');
else {
  const validatorKeys = [...validatorBlock[1].matchAll(/'([^']+@\d+)'/g)].map((match) => match[1]);
  const validatorSet = new Set(validatorKeys);
  for (const key of interactiveRuntimeKeys) if (!validatorSet.has(key)) errors.push(`${key}: manifest engine missing from content validator supportedEngines`);
  for (const key of validatorSet) if (!interactiveRuntimeKeys.includes(key)) errors.push(`${key}: content validator engine missing from manifest`);
}

const questionContract = readText('src/contracts/question.ts');
for (const engine of engines.filter((item) => item.category === 'interactive')) {
  if (!questionContract.includes(`type: '${engine.interactionType}'`)) errors.push(`${engine.key}: interaction type missing from Question contract`);
  if (!questionContract.includes(`type: '${engine.solutionType}'`)) errors.push(`${engine.key}: solution type missing from Question contract`);
}

if (errors.length) {
  console.error(`Engine registry validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Engine registry OK: ${engines.length} engine(s), ${dataTypeKeys.size} datatype(s), ${interactiveRuntimeKeys.length} interactive runtime engine(s), ${outputManifestKeys.length} output engine(s), category/runtime contracts aligned.`);
}
