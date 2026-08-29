export const choiceItemSupportedEngines = ['single_choice@1'];

export function formatChoiceItem(data, recipe) {
  const unit = data.units?.[0];
  if (!unit) throw new Error(`${data.sourceRef}: choice_item normalized data requires one unit`);
  const choices = Array.isArray(unit.choices) ? unit.choices : [];
  if (!String(unit.prompt ?? '').trim()) throw new Error(`${data.sourceRef}: choice_item requires prompt`);
  if (choices.length < 2) throw new Error(`${data.sourceRef}: choice_item requires at least two choices`);
  if (!choices.some((choice) => choice.id === unit.correctChoiceId)) {
    throw new Error(`${data.sourceRef}: correctChoiceId must refer to one of the choices`);
  }

  return {
    questions: [{
      id: recipe.id,
      revision: recipe.revision ?? 1,
      schemaVersion: 1,
      conceptIds: unit.conceptIds ?? [],
      difficulty: recipe.difficulty ?? 1,
      language: data.language ?? 'en',
      prompt: { text: recipe.prompt ?? unit.prompt },
      feedback: recipe.feedback ?? { correct: 'Correct.', incorrect: 'Try again.' },
      authoring: {
        status: data.authoring?.status ?? 'reviewed',
        source: `knowledge:${data.sourceRef}`,
        compiledBy: `${data.datatype}->single_choice@1`
      },
      interaction: {
        type: 'single_choice',
        version: 1,
        shuffleOptions: recipe.shuffleOptions ?? true,
        options: choices.map((choice) => ({ id: choice.id, label: choice.label }))
      },
      solution: { type: 'exact_option', correctOptionIds: [unit.correctChoiceId] }
    }],
    crosswordAuthoring: []
  };
}
