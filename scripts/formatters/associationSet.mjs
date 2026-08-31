const unique = (values) => [...new Set(values)];

const articleFor = (text) => /^[aeiou]/i.test(String(text).trim()) ? 'an' : 'a';
const capitalize = (text) => {
  const value = String(text ?? '');
  return value ? value[0].toUpperCase() + value.slice(1) : value;
};
const semanticRefFor = (node) => typeof node?.id === 'string' && node.id.trim() ? node.id : undefined;

const selectedUnits = (source, recipe) => {
  const units = Array.isArray(source.units) ? source.units : [];
  let selected = units;
  if (recipe.rowIds?.length) {
    const byId = new Map(units.map((unit) => [unit.rowId, unit]));
    selected = recipe.rowIds.map((id) => {
      const unit = byId.get(id);
      if (!unit) throw new Error(`${recipe.id}: unknown rowId ${id} in ${source.sourceRef}`);
      return unit;
    });
  } else if (recipe.entryIds?.length) {
    const byLocalId = new Map(units.map((unit) => [unit.localId, unit]));
    selected = recipe.entryIds.map((id) => {
      const unit = byLocalId.get(id);
      if (!unit) throw new Error(`${recipe.id}: unknown entry ${id} in ${source.sourceRef}`);
      return unit;
    });
  }

  const hasOffset = recipe.entryOffset !== undefined;
  const hasLimit = recipe.entryLimit !== undefined;
  if (!hasOffset && !hasLimit) return selected;
  const offset = hasOffset ? Number(recipe.entryOffset) : 0;
  const limit = hasLimit ? Number(recipe.entryLimit) : selected.length - offset;
  if (!Number.isInteger(offset) || offset < 0) throw new Error(`${recipe.id}: entryOffset must be a non-negative integer`);
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`${recipe.id}: entryLimit must be a positive integer`);
  if (offset >= selected.length) throw new Error(`${recipe.id}: entryOffset ${offset} is outside ${source.sourceRef}`);
  return selected.slice(offset, offset + limit);
};

const defaultFeedback = {
  correct: 'Correct. You connected the knowledge in the right way.',
  incorrect: 'Try again and use the relationship between the two ideas.'
};

const baseQuestion = (source, recipe, units, defaultPrompt) => ({
  id: recipe.id,
  revision: recipe.revision ?? 1,
  schemaVersion: 1,
  conceptIds: unique(units.flatMap((unit) => unit.conceptIds ?? [])),
  difficulty: recipe.difficulty ?? 2,
  language: source.language ?? 'en',
  prompt: { text: recipe.prompt ?? defaultPrompt },
  feedback: recipe.feedback ?? defaultFeedback,
  authoring: {
    status: source.authoring?.status ?? 'reviewed',
    source: `knowledge:${source.sourceRef}`,
    compiledBy: `${source.datatype}->${recipe.engine}`
  }
});

const questionPromptFor = (unit) => {
  const object = unit.object.label;
  if (unit.relation === 'known_as') return `Which of the following is called the ${object}?`;
  if (unit.relation === 'is_a') return `Which of the following is ${articleFor(object)} ${object}?`;
  if (unit.relation === 'means') return `Which word means “${object}”?`;
  if (unit.relation === 'synonym_of') return `Which word is a synonym of “${object}”?`;
  if (unit.relation === 'antonym_of') return `Which word is an antonym of “${object}”?`;
  if (unit.relation === 'homophone_of') return `Which word is a homophone of “${object}”?`;
  return `Which of the following is connected with “${object}”?`;
};

const reverseQuestionPromptFor = (unit) => {
  const subject = unit.subject.label;
  if (unit.relation === 'means') return `What does “${subject}” mean?`;
  if (unit.relation === 'synonym_of') return `Which word is a synonym of “${subject}”?`;
  if (unit.relation === 'antonym_of') return `Which word is an antonym of “${subject}”?`;
  if (unit.relation === 'homophone_of') return `Which word is a homophone of “${subject}”?`;
  if (unit.relation === 'known_as') return `What is “${subject}” known as?`;
  if (unit.relation === 'is_a') return `What kind of thing is “${subject}”?`;
  return `Which idea is connected with “${subject}”?`;
};

const spellingPromptFor = (unit) => {
  const object = unit.object.label;
  if (unit.relation === 'means') return `Unscramble the word that means “${object}”.`;
  if (unit.relation === 'synonym_of') return `Unscramble a word that is a synonym of “${object}”.`;
  if (unit.relation === 'antonym_of') return `Unscramble a word that is an antonym of “${object}”.`;
  if (unit.relation === 'homophone_of') return `Unscramble a word that is a homophone of “${object}”.`;
  return `Unscramble the word connected with “${object}”.`;
};

const formatMemory = (source, recipe, units) => {
  const base = baseQuestion(source, recipe, units, 'Find the cards that belong together.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'memory_pairs',
        version: 1,
        seed: recipe.seed ?? 1,
        cards: units.flatMap((unit) => [
          {
            id: `${unit.localId}:subject`,
            label: unit.subject.label,
            symbol: unit.subject.symbol,
            semanticRef: semanticRefFor(unit.subject)
          },
          {
            id: `${unit.localId}:object`,
            label: unit.object.label,
            symbol: unit.object.symbol,
            semanticRef: semanticRefFor(unit.object)
          }
        ])
      },
      solution: { type: 'pair_matches', pairs: units.map((unit) => [`${unit.localId}:subject`, `${unit.localId}:object`]) }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
};

const formatMatching = (source, recipe, units) => {
  const base = baseQuestion(source, recipe, units, 'Match each item to the description that belongs with it.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'drag_to_target',
        version: 1,
        // Matching remains deliberately text/symbol authored. Do not infer
        // visual cues here: they can turn classification targets into hints.
        items: units.map((unit) => ({ id: `${unit.localId}:subject`, label: unit.subject.label, symbol: unit.subject.symbol })),
        targets: units.map((unit) => ({ id: `${unit.localId}:object`, label: unit.object.label, symbol: unit.object.symbol }))
      },
      solution: { type: 'target_assignment', assignments: Object.fromEntries(units.map((unit) => [`${unit.localId}:subject`, `${unit.localId}:object`])) }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
};

const formatWordSearch = (source, recipe, units) => {
  const base = baseQuestion(source, recipe, units, 'Find the words.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'word_search',
        version: 1,
        seed: recipe.seed ?? 1,
        gridSize: recipe.gridSize,
        directions: recipe.directions,
        terms: units.map((unit) => ({ id: `${unit.localId}:subject`, label: unit.subject.label, word: unit.subject.label }))
      },
      solution: { type: 'found_terms', requiredTermIds: units.map((unit) => `${unit.localId}:subject`) }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
};

const formatSequenceOrder = (source, recipe, units) => {
  if (units.length !== 1) throw new Error(`${recipe.id}: sequence_order spelling recipe must select exactly one unit`);
  const target = units[0];
  const mode = recipe.sequenceMode ?? 'subject_letters';
  if (mode !== 'subject_letters') throw new Error(`${recipe.id}: unsupported association_set sequenceMode ${mode}`);
  const letters = Array.from(String(target.subject.label ?? '').toUpperCase()).filter((letter) => /[A-Z0-9]/.test(letter));
  if (letters.length < 2) throw new Error(`${recipe.id}: subject must contain at least two spellable characters`);
  const items = letters.map((letter, index) => ({ id: `${target.localId}:letter:${index}`, label: letter }));
  const base = baseQuestion(source, recipe, units, spellingPromptFor(target));
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'sequence_order',
        version: 1,
        seed: recipe.seed ?? 1,
        items
      },
      solution: { type: 'ordered_items', orderedItemIds: items.map((item) => item.id) }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
};

const formatCrossword = (source, recipe, units) => ({
  questions: [],
  crosswordAuthoring: [{
    id: recipe.id,
    title: recipe.title ?? `${source.topic ?? 'Knowledge'} crossword`,
    clues: units.map((unit) => ({
      id: unit.rowId,
      answer: unit.subject.label,
      clue: capitalize(unit.object.label),
      rowId: unit.rowId
    }))
  }],
  outputContracts: []
});

const formatSingleChoice = (source, recipe, units) => {
  if (units.length !== 1) throw new Error(`${recipe.id}: single_choice recipe must select exactly one unit`);
  const unit = units[0];
  const allUnits = Array.isArray(source.units) ? source.units : [];
  const direction = recipe.choiceDirection ?? 'object_to_subject';
  if (!['object_to_subject', 'subject_to_object'].includes(direction)) throw new Error(`${recipe.id}: unsupported choiceDirection ${direction}`);
  const distractorCount = Math.max(1, Number(recipe.distractorCount ?? 3));
  const candidateUnits = allUnits.filter((candidate) => candidate.rowId !== unit.rowId);
  const distractors = candidateUnits.slice(0, distractorCount);
  if (!distractors.length) throw new Error(`${recipe.id}: single_choice requires at least one distractor`);
  const optionFor = direction === 'object_to_subject'
    ? (candidate) => ({ id: `${candidate.localId}:subject`, label: candidate.subject.label, symbol: candidate.subject.symbol, semanticRef: semanticRefFor(candidate.subject) })
    : (candidate) => ({ id: `${candidate.localId}:object`, label: candidate.object.label, symbol: candidate.object.symbol, semanticRef: semanticRefFor(candidate.object) });
  const base = baseQuestion(source, recipe, units, direction === 'object_to_subject' ? questionPromptFor(unit) : reverseQuestionPromptFor(unit));
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'single_choice',
        version: 1,
        shuffleOptions: recipe.shuffleOptions ?? true,
        options: [optionFor(unit), ...distractors.map(optionFor)]
      },
      solution: { type: 'exact_option', correctOptionIds: [direction === 'object_to_subject' ? `${unit.localId}:subject` : `${unit.localId}:object`] }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
};

const formatWordBankFill = (source, recipe, units) => {
  if (units.length !== 1) throw new Error(`${recipe.id}: word_bank_fill recipe must select exactly one unit`);
  const unit = units[0];
  const allUnits = Array.isArray(source.units) ? source.units : [];
  const distractorCount = Math.max(1, Number(recipe.distractorCount ?? 3));
  const distractors = allUnits.filter((candidate) => candidate.rowId !== unit.rowId).slice(0, distractorCount);
  const choices = [unit, ...distractors].map((candidate) => ({ id: `${candidate.localId}:subject`, label: candidate.subject.label }));
  const base = baseQuestion(source, recipe, units, `Complete the idea: ${capitalize(unit.object.label)} — ____`);
  return {
    questions: [{
      ...base,
      interaction: { type: 'word_bank_fill', version: 1, choices },
      solution: { type: 'exact_option', correctOptionIds: [`${unit.localId}:subject`] }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
};

const formatPrintCards = (source, recipe, units) => {
  const direction = recipe.cardDirection ?? 'object_to_subject';
  if (!['object_to_subject', 'subject_to_object'].includes(direction)) throw new Error(`${recipe.id}: unsupported cardDirection ${direction}`);
  const cards = units.map((unit) => {
    const subjectSide = { text: unit.subject.label, symbol: unit.subject.symbol ?? null };
    const objectSide = { text: capitalize(unit.object.label), symbol: unit.object.symbol ?? null };
    return {
      id: unit.rowId,
      rowId: unit.rowId,
      front: direction === 'object_to_subject' ? objectSide : subjectSide,
      back: direction === 'object_to_subject' ? subjectSide : objectSide
    };
  });
  return {
    questions: [],
    crosswordAuthoring: [],
    outputContracts: [{
      id: recipe.id,
      type: 'print_cards',
      version: 1,
      engine: 'print_cards@1',
      title: recipe.title ?? `${source.topic ?? 'Learning'} memory cards`,
      sourceRef: source.sourceRef,
      rowIds: units.map((unit) => unit.rowId),
      cards
    }]
  };
};

export const associationSetSupportedEngines = [
  'single_choice@1',
  'word_bank_fill@1',
  'drag_to_target@1',
  'memory_pairs@1',
  'word_search@1',
  'sequence_order@1',
  'crossword@1',
  'print_cards@1'
];

export function formatAssociationSet(source, recipe) {
  const units = selectedUnits(source, recipe);
  if (!units.length) throw new Error(`${recipe.id}: no units selected from ${source.sourceRef}`);
  switch (recipe.engine) {
    case 'memory_pairs@1': return formatMemory(source, recipe, units);
    case 'drag_to_target@1': return formatMatching(source, recipe, units);
    case 'word_search@1': return formatWordSearch(source, recipe, units);
    case 'sequence_order@1': return formatSequenceOrder(source, recipe, units);
    case 'crossword@1': return formatCrossword(source, recipe, units);
    case 'single_choice@1': return formatSingleChoice(source, recipe, units);
    case 'word_bank_fill@1': return formatWordBankFill(source, recipe, units);
    case 'print_cards@1': return formatPrintCards(source, recipe, units);
    default: throw new Error(`${recipe.id}: association_set formatter does not support ${recipe.engine}`);
  }
}
