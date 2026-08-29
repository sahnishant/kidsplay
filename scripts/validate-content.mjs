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
  'word_search@1',
  'memory_pairs@1'
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

const pairKey = (first, second) => (first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`);

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

  if (interaction?.type === 'memory_pairs') {
    const cardIds = duplicateIds(interaction.cards ?? [], `${prefix} memory card`);
    if (cardIds.size < 4 || cardIds.size % 2 !== 0) {
      errors.push(`${prefix}: memory pairs needs an even number of cards and at least four cards`);
    }
    if (!Number.isInteger(interaction.seed)) errors.push(`${prefix}: memory-pairs seed must be an integer`);
    if (question.solution?.type !== 'pair_matches') errors.push(`${prefix}: memory pairs requires pair_matches solution`);

    const pairs = question.solution?.pairs ?? [];
    const seenPairKeys = new Set();
    const usedCardIds = new Set();

    for (const pair of pairs) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        errors.push(`${prefix}: every memory solution pair must contain exactly two card ids`);
        continue;
      }
      const [first, second] = pair;
      if (typeof first !== 'string' || typeof second !== 'string') {
        errors.push(`${prefix}: memory solution pair ids must be strings`);
        continue;
      }
      if (first === second) errors.push(`${prefix}: a memory card cannot be paired with itself (${first})`);
      if (!cardIds.has(first)) errors.push(`${prefix}: solution refers to missing memory card ${first}`);
      if (!cardIds.has(second)) errors.push(`${prefix}: solution refers to missing memory card ${second}`);

      const key = pairKey(first, second);
      if (seenPairKeys.has(key)) errors.push(`${prefix}: duplicate memory pair ${first} / ${second}`);
      seenPairKeys.add(key);

      for (const cardId of [first, second]) {
        if (usedCardIds.has(cardId)) errors.push(`${prefix}: memory card ${cardId} appears in more than one solution pair`);
        usedCardIds.add(cardId);
      }
    }

    if (pairs.length * 2 !== cardIds.size) {
      errors.push(`${prefix}: memory solution must pair every card exactly once`);
    }
    for (const cardId of cardIds) {
      if (!usedCardIds.has(cardId)) errors.push(`${prefix}: memory card ${cardId} is not assigned to a solution pair`);
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
