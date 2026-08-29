const unique = (values) => [...new Set(values)];

const articleFor = (text) => /^[aeiou]/i.test(String(text).trim()) ? 'an' : 'a';
const capitalize = (text) => {
  const value = String(text ?? '');
  return value ? value[0].toUpperCase() + value.slice(1) : value;
};

const selectedEntries = (source, recipe) => {
  const entries = Array.isArray(source.entries) ? source.entries : [];
  if (!recipe.entryIds?.length) return entries;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return recipe.entryIds.map((id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`${recipe.id}: unknown entry ${id} in ${source.id}`);
    return entry;
  });
};

const defaultFeedback = {
  correct: 'Correct. You connected the knowledge in the right way.',
  incorrect: 'Try again and use the relationship between the two ideas.'
};

const baseQuestion = (source, recipe, entries, defaultPrompt) => ({
  id: recipe.id,
  revision: recipe.revision ?? 1,
  schemaVersion: 1,
  conceptIds: unique(entries.flatMap((entry) => entry.conceptIds ?? [])),
  gradeBands: recipe.gradeBands ?? source.gradeBands ?? [],
  difficulty: recipe.difficulty ?? 2,
  language: source.language ?? 'en',
  prompt: { text: recipe.prompt ?? defaultPrompt },
  feedback: recipe.feedback ?? defaultFeedback,
  authoring: {
    status: source.authoring?.status ?? 'reviewed',
    source: `knowledge:${source.id}`,
    compiledBy: `${source.kind}@${source.version}->${recipe.engine}`
  }
});

const questionPromptFor = (entry) => {
  const object = entry.object.label;
  if (entry.relation === 'known_as') return `Which of the following is called the ${object}?`;
  if (entry.relation === 'is_a') return `Which of the following is ${articleFor(object)} ${object}?`;
  return `Which of the following is connected with “${object}”?`;
};

const formatMemory = (source, recipe, entries) => {
  const base = baseQuestion(source, recipe, entries, 'Find the cards that belong together.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'memory_pairs',
        version: 1,
        seed: recipe.seed ?? 1,
        cards: entries.flatMap((entry) => [
          { id: `${entry.id}:subject`, label: entry.subject.label, symbol: entry.subject.symbol },
          { id: `${entry.id}:object`, label: entry.object.label, symbol: entry.object.symbol }
        ])
      },
      solution: {
        type: 'pair_matches',
        pairs: entries.map((entry) => [`${entry.id}:subject`, `${entry.id}:object`])
      }
    }],
    crosswordAuthoring: []
  };
};

const formatMatching = (source, recipe, entries) => {
  const base = baseQuestion(source, recipe, entries, 'Match each item to the description that belongs with it.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'drag_to_target',
        version: 1,
        items: entries.map((entry) => ({
          id: `${entry.id}:subject`,
          label: entry.subject.label,
          symbol: entry.subject.symbol
        })),
        targets: entries.map((entry) => ({
          id: `${entry.id}:object`,
          label: entry.object.label,
          symbol: entry.object.symbol
        }))
      },
      solution: {
        type: 'target_assignment',
        assignments: Object.fromEntries(
          entries.map((entry) => [`${entry.id}:subject`, `${entry.id}:object`])
        )
      }
    }],
    crosswordAuthoring: []
  };
};

const formatWordSearch = (source, recipe, entries) => {
  const base = baseQuestion(source, recipe, entries, 'Find the words.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'word_search',
        version: 1,
        seed: recipe.seed ?? 1,
        gridSize: recipe.gridSize,
        directions: recipe.directions,
        terms: entries.map((entry) => ({
          id: `${entry.id}:subject`,
          label: entry.subject.label,
          word: entry.subject.label
        }))
      },
      solution: {
        type: 'found_terms',
        requiredTermIds: entries.map((entry) => `${entry.id}:subject`)
      }
    }],
    crosswordAuthoring: []
  };
};

const formatCrossword = (source, recipe, entries) => {
  const base = baseQuestion(source, recipe, entries, 'Solve the crossword.');
  return {
    questions: [],
    crosswordAuthoring: [{
      ...base,
      entries: entries.map((entry) => ({
        id: entry.id,
        answer: entry.subject.label,
        clue: capitalize(entry.object.label)
      }))
    }]
  };
};

const formatSingleChoice = (source, recipe, entries) => {
  if (entries.length !== 1) throw new Error(`${recipe.id}: single_choice recipe must select exactly one entry`);
  const target = entries[0];
  const allEntries = source.entries ?? [];
  const distractorCount = recipe.distractorCount ?? 3;
  const distractors = allEntries.filter((entry) => entry.id !== target.id).slice(0, distractorCount);
  if (distractors.length < distractorCount) {
    throw new Error(`${recipe.id}: not enough distractors in ${source.id}`);
  }
  const optionEntries = [target, ...distractors];
  const base = baseQuestion(source, recipe, entries, questionPromptFor(target));
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'single_choice',
        version: 1,
        shuffleOptions: true,
        options: optionEntries.map((entry) => ({
          id: `${entry.id}:subject`,
          label: entry.subject.label
        }))
      },
      solution: {
        type: 'exact_option',
        correctOptionIds: [`${target.id}:subject`]
      }
    }],
    crosswordAuthoring: []
  };
};

const formatWordBankFill = (source, recipe, entries) => {
  if (entries.length !== 1) throw new Error(`${recipe.id}: word_bank_fill recipe must select exactly one entry`);
  const target = entries[0];
  const template = recipe.sentenceTemplate ?? '{subject} — {blank}';
  const parts = template.split('{blank}');
  if (parts.length !== 2) throw new Error(`${recipe.id}: sentenceTemplate must contain {blank} exactly once`);
  const renderText = (value) => String(value).replaceAll('{subject}', target.subject.label).replaceAll('{object}', target.object.label);
  const distractorCount = recipe.distractorCount ?? 3;
  const bankEntries = [
    target,
    ...(source.entries ?? []).filter((entry) => entry.id !== target.id).slice(0, distractorCount)
  ];
  const before = renderText(parts[0]);
  const after = renderText(parts[1]);
  const segments = [];
  if (before) segments.push({ type: 'text', value: before });
  segments.push({ type: 'blank', id: 'answer' });
  if (after) segments.push({ type: 'text', value: after });
  const base = baseQuestion(source, recipe, entries, 'Complete the sentence.');
  return {
    questions: [{
      ...base,
      interaction: {
        type: 'word_bank_fill',
        version: 1,
        segments,
        wordBank: bankEntries.map((entry) => ({
          id: `${entry.id}:object`,
          label: entry.object.label
        }))
      },
      solution: {
        type: 'blank_answers',
        answers: { answer: [`${target.id}:object`] }
      }
    }],
    crosswordAuthoring: []
  };
};

export function formatAssociationSet(source, recipe) {
  const entries = selectedEntries(source, recipe);
  if (!entries.length) throw new Error(`${recipe.id}: no entries selected from ${source.id}`);

  switch (recipe.engine) {
    case 'memory_pairs@1': return formatMemory(source, recipe, entries);
    case 'drag_to_target@1': return formatMatching(source, recipe, entries);
    case 'word_search@1': return formatWordSearch(source, recipe, entries);
    case 'crossword@1': return formatCrossword(source, recipe, entries);
    case 'single_choice@1': return formatSingleChoice(source, recipe, entries);
    case 'word_bank_fill@1': return formatWordBankFill(source, recipe, entries);
    default: throw new Error(`${recipe.id}: association_set formatter does not support ${recipe.engine}`);
  }
}
