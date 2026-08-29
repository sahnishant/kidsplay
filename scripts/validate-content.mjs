import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const learnables = readJson('content/learnables/animals.json');
const scenes = readJson('content/scenes/animals.json');
const questions = readJson('content/questions/animals.json');
const packs = [
  readJson('content/packs/free-animals.json'),
  readJson('content/packs/class2-evs-olympiad-prototype.json')
];

const errors = [];
const supportedEngines = new Set([
  'single_choice@1',
  'word_bank_fill@1',
  'drag_to_target@1'
]);

const duplicateIds = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item?.id) {
      errors.push(`${label} contains an item without id`);
      continue;
    }
    if (seen.has(item.id)) errors.push(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
};

const conceptIds = duplicateIds(learnables, 'learnable');
const sceneIds = duplicateIds(scenes, 'scene');
const questionIds = duplicateIds(questions, 'question');
duplicateIds(packs, 'pack');

for (const question of questions) {
  const prefix = question.id ?? '<unknown question>';

  if (question.schemaVersion !== 1) errors.push(`${prefix}: unsupported schemaVersion`);
  if (!Number.isInteger(question.revision) || question.revision < 1) {
    errors.push(`${prefix}: revision must be a positive integer`);
  }
  if (Object.hasOwn(question, 'access')) {
    errors.push(`${prefix}: access/free/paid policy belongs in packs, not questions`);
  }

  for (const conceptId of question.conceptIds ?? []) {
    if (!conceptIds.has(conceptId)) errors.push(`${prefix}: unknown concept ${conceptId}`);
  }

  if (question.stimulus?.type === 'scene' && !sceneIds.has(question.stimulus.sceneId)) {
    errors.push(`${prefix}: unknown scene ${question.stimulus.sceneId}`);
  }

  const interaction = question.interaction;
  const engineKey = `${interaction?.type}@${interaction?.version}`;
  if (!supportedEngines.has(engineKey)) errors.push(`${prefix}: unsupported engine ${engineKey}`);
  if (interaction && Object.hasOwn(interaction, 'access')) {
    errors.push(`${prefix}: engine contract must not contain access policy`);
  }

  if (interaction?.type === 'single_choice') {
    const optionIds = duplicateIds(interaction.options ?? [], `${prefix} option`);
    if (optionIds.size < 2) errors.push(`${prefix}: single choice needs at least two options`);
    for (const id of question.solution?.correctOptionIds ?? []) {
      if (!optionIds.has(id)) errors.push(`${prefix}: solution refers to missing option ${id}`);
    }
  }

  if (interaction?.type === 'word_bank_fill') {
    const blankIds = new Set(
      (interaction.segments ?? []).filter((segment) => segment.type === 'blank').map((segment) => segment.id)
    );
    const wordIds = duplicateIds(interaction.wordBank ?? [], `${prefix} word`);
    for (const [blankId, acceptedIds] of Object.entries(question.solution?.answers ?? {})) {
      if (!blankIds.has(blankId)) errors.push(`${prefix}: solution refers to missing blank ${blankId}`);
      for (const acceptedId of acceptedIds) {
        if (!wordIds.has(acceptedId)) errors.push(`${prefix}: blank ${blankId} accepts missing word ${acceptedId}`);
      }
    }
    for (const blankId of blankIds) {
      if (!question.solution?.answers?.[blankId]?.length) errors.push(`${prefix}: blank ${blankId} has no answer`);
    }
  }

  if (interaction?.type === 'drag_to_target') {
    const itemIds = duplicateIds(interaction.items ?? [], `${prefix} drag item`);
    const targetIds = duplicateIds(interaction.targets ?? [], `${prefix} target`);
    for (const [itemId, targetId] of Object.entries(question.solution?.assignments ?? {})) {
      if (!itemIds.has(itemId)) errors.push(`${prefix}: solution refers to missing item ${itemId}`);
      if (!targetIds.has(targetId)) errors.push(`${prefix}: solution refers to missing target ${targetId}`);
    }
    for (const itemId of itemIds) {
      if (!question.solution?.assignments?.[itemId]) errors.push(`${prefix}: drag item ${itemId} has no target answer`);
    }
  }
}

for (const pack of packs) {
  for (const questionRef of pack.questionRefs ?? []) {
    if (!questionIds.has(questionRef)) errors.push(`${pack.id}: unknown question ${questionRef}`);
  }
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Content OK: ${learnables.length} learnables, ${scenes.length} scenes, ${questions.length} questions, ${packs.length} packs.`);
}
