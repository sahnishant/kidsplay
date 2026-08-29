export function formatChoiceItem(data, recipe) {
  const choices = Array.isArray(data.choices) ? data.choices : [];
  if (!String(data.prompt ?? '').trim()) throw new Error(`${data.id}: choice_item requires prompt`);
  if (choices.length < 2) throw new Error(`${data.id}: choice_item requires at least two choices`);
  if (!choices.some((choice) => choice.id === data.correctChoiceId)) {
    throw new Error(`${data.id}: correctChoiceId must refer to one of the choices`);
  }

  return {
    questions: [{
      id: recipe.id,
      revision: recipe.revision ?? 1,
      schemaVersion: 1,
      conceptIds: data.conceptIds ?? [],
      gradeBands: recipe.gradeBands ?? data.gradeBands ?? [],
      difficulty: recipe.difficulty ?? 1,
      language: data.language ?? 'en',
      prompt: { text: recipe.prompt ?? data.prompt },
      feedback: recipe.feedback ?? {
        correct: 'Correct.',
        incorrect: 'Try again.'
      },
      authoring: {
        status: data.authoring?.status ?? 'reviewed',
        source: `knowledge:${data.id}`,
        compiledBy: `choice_item@1->single_choice@1`
      },
      interaction: {
        type: 'single_choice',
        version: 1,
        shuffleOptions: recipe.shuffleOptions ?? true,
        options: choices.map((choice) => ({ id: choice.id, label: choice.label }))
      },
      solution: {
        type: 'exact_option',
        correctOptionIds: [data.correctChoiceId]
      }
    }],
    crosswordAuthoring: []
  };
}
