import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const errors = [];

const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const readArrayDirectory = (directory) => {
  const files = readdirSync(new URL(directory, root)).filter((name) => name.endsWith('.json')).sort();
  return files.flatMap((file) => {
    const value = readJson(`${directory}${file}`);
    if (!Array.isArray(value)) {
      errors.push(`${directory}${file}: expected a JSON array`);
      return [];
    }
    return value;
  });
};

const readObjectDirectory = (directory) => {
  const files = readdirSync(new URL(directory, root)).filter((name) => name.endsWith('.json')).sort();
  return files.flatMap((file) => {
    const value = readJson(`${directory}${file}`);
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      errors.push(`${directory}${file}: expected a JSON object`);
      return [];
    }
    return [value];
  });
};

const learnables = readArrayDirectory('content/learnables/');
const scenes = readArrayDirectory('content/scenes/');
const questions = readArrayDirectory('content/questions/');
const packs = readObjectDirectory('content/packs/');

const supportedEngines = new Set([
  'single_choice@1',
  'word_bank_fill@1',
  'drag_to_target@1',
  'word_search@1'
]);

const wordSearchDirections = new Set([
  'right',
  'left',
  'down',
  'up',
  'down_right',
  'down_left',
  'up_right',
  'up_left'
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

  if (interaction?.type === 'word_search') {
    const termIds = duplicateIds(interaction.terms ?? [], `${prefix} word-search term`);
    if (!termIds.size) errors.push(`${prefix}: word search needs at least one term`);
    if (!Number.isInteger(interaction.seed)) errors.push(`${prefix}: word-search seed must be an integer`);
    if (interaction.gridSize !== undefined && (!Number.isInteger(interaction.gridSize) || interaction.gridSize < 2)) {
      errors.push(`${prefix}: word-search gridSize must be an integer >= 2`);
    }
    for (const term of interaction.terms ?? []) {
      const normalized = Array.from(String(term.word ?? '').trim().replace(/[\s-]+/g, ''));
      if (normalized.length < 2) errors.push(`${prefix}: term ${term.id ?? '<unknown>'} needs at least two letters`);
    }
    for (const direction of interaction.directions ?? []) {
      if (!wordSearchDirections.has(direction)) errors.push(`${prefix}: unsupported word-search direction ${direction}`);
    }
    for (const termId of question.solution?.requiredTermIds ?? []) {
      if (!termIds.has(termId)) errors.push(`${prefix}: solution refers to missing word-search term ${termId}`);
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
  console.log(
    `Content OK: ${learnables.length} learnables, ${scenes.length} scenes, ${questions.length} questions, ${packs.length} packs.`
  );
}
