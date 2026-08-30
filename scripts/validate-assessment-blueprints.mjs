import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const fail = (message) => {
  console.error(`Assessment blueprint validation failed: ${message}`);
  process.exit(1);
};

const profileRegistry = readJson('content/learning-profiles/registry.json');
const sourceRegistry = readJson('content/alignment-sources/registry.json');
const profileById = new Map((profileRegistry.profiles ?? []).map((profile) => [profile.id, profile]));
const sourceById = new Map((sourceRegistry.sources ?? []).map((source) => [source.id, source]));
const allowedStatuses = new Set(['prototype_from_reviewed_format']);
const allowedSelectors = new Set(['logical_reasoning', 'science_core', 'achiever_hots']);
const blueprintFiles = readdirSync(new URL('content/assessment-blueprints/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();

if (!blueprintFiles.length) fail('no blueprint files found');

const seenIds = new Set();
let totalSlots = 0;

for (const file of blueprintFiles) {
  const blueprint = readJson(`content/assessment-blueprints/${file}`);
  if (blueprint.schemaVersion !== 1) fail(`${file} must use schemaVersion 1`);
  if (typeof blueprint.id !== 'string' || !blueprint.id) fail(`${file} needs an id`);
  if (seenIds.has(blueprint.id)) fail(`duplicate blueprint id ${blueprint.id}`);
  seenIds.add(blueprint.id);

  const profile = profileById.get(blueprint.profileRef);
  if (!profile) fail(`${file} refers to unknown profile ${blueprint.profileRef}`);
  if (!allowedStatuses.has(blueprint.status)) fail(`${file} has unsupported status ${blueprint.status}`);
  if (typeof blueprint.academicYear !== 'string' || !blueprint.academicYear) fail(`${file} needs academicYear`);
  if (profile.alignment?.academicYear && profile.alignment.academicYear !== blueprint.academicYear) {
    fail(`${file} academicYear ${blueprint.academicYear} differs from profile ${profile.id} alignment year ${profile.alignment.academicYear}`);
  }

  for (const field of ['title', 'description', 'actionLabel']) {
    if (typeof blueprint[field] !== 'string' || !blueprint[field].trim()) fail(`${file} needs ${field}`);
  }
  if (!Number.isInteger(blueprint.totalQuestions) || blueprint.totalQuestions <= 0) fail(`${file} needs a positive integer totalQuestions`);

  if (!Array.isArray(blueprint.sourceRefs) || !blueprint.sourceRefs.length) fail(`${file} needs sourceRefs`);
  const uniqueSourceRefs = new Set(blueprint.sourceRefs);
  if (uniqueSourceRefs.size !== blueprint.sourceRefs.length) fail(`${file} has duplicate sourceRefs`);
  let hasOfficialAssessment = false;
  for (const sourceRef of blueprint.sourceRefs) {
    const source = sourceById.get(sourceRef);
    if (!source) fail(`${file} refers to unknown source ${sourceRef}`);
    if (source.status !== 'reviewed') fail(`${file} source ${sourceRef} is not reviewed`);
    if (source.academicYear && source.academicYear !== blueprint.academicYear) {
      fail(`${file} source ${sourceRef} academicYear ${source.academicYear} does not match ${blueprint.academicYear}`);
    }
    if (source.type === 'official_assessment') hasOfficialAssessment = true;
  }
  if (!hasOfficialAssessment) fail(`${file} must cite at least one reviewed official_assessment source`);

  if (!Array.isArray(blueprint.sections) || !blueprint.sections.length) fail(`${file} needs sections`);
  const sectionIds = new Set();
  let sectionTotal = 0;
  for (const section of blueprint.sections) {
    if (typeof section.id !== 'string' || !section.id) fail(`${file} has a section without id`);
    if (sectionIds.has(section.id)) fail(`${file} has duplicate section id ${section.id}`);
    sectionIds.add(section.id);
    if (typeof section.title !== 'string' || !section.title.trim()) fail(`${file} section ${section.id} needs title`);
    if (!Number.isInteger(section.count) || section.count <= 0) fail(`${file} section ${section.id} needs a positive integer count`);
    if (!allowedSelectors.has(section.selector)) fail(`${file} section ${section.id} has unsupported selector ${section.selector}`);
    sectionTotal += section.count;
  }
  if (sectionTotal !== blueprint.totalQuestions) {
    fail(`${file} section count ${sectionTotal} does not equal totalQuestions ${blueprint.totalQuestions}`);
  }
  totalSlots += blueprint.totalQuestions;
}

console.log(`Assessment blueprint OK: ${blueprintFiles.length} blueprint(s), ${totalSlots} validated question slot(s).`);
