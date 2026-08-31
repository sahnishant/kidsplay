export const processSupportedEngines = ['sequence_order@1'];

const defaultFeedback = {
  correct: 'Correct. You put the stages in the right order.',
  incorrect: 'Try again and think about what happens first, next and last.'
};

export function formatProcess(data, recipe) {
  if (!Array.isArray(data.units) || data.units.length !== 1) {
    throw new Error(`${data.sourceRef}: process formatter requires exactly one normalized process unit`);
  }
  if (recipe.engine !== 'sequence_order@1') {
    throw new Error(`${data.sourceRef}: process formatter does not support ${recipe.engine}`);
  }

  const unit = data.units[0];
  const stages = Array.isArray(unit.stages) ? unit.stages : [];
  if (stages.length < 2) throw new Error(`${data.sourceRef}: process sequence requires at least two stages`);
  const items = stages.map((stage) => ({
    id: `${unit.localId}:stage:${stage.id}`,
    label: stage.label,
    ...(stage.semanticRef ? { semanticRef: stage.semanticRef } : {})
  }));

  return {
    questions: [{
      id: recipe.id,
      revision: recipe.revision ?? 1,
      schemaVersion: 1,
      conceptIds: [...new Set(unit.conceptIds ?? [])],
      difficulty: recipe.difficulty ?? 2,
      language: data.language ?? 'en',
      prompt: { text: recipe.prompt ?? `Put the stages of ${unit.prompt} in order.` },
      feedback: recipe.feedback ?? defaultFeedback,
      authoring: {
        status: data.authoring?.status ?? 'reviewed',
        source: `knowledge:${data.sourceRef}`,
        compiledBy: `${data.datatype}->sequence_order@1`
      },
      interaction: {
        type: 'sequence_order',
        version: 1,
        seed: recipe.seed ?? 1,
        items
      },
      solution: {
        type: 'ordered_items',
        orderedItemIds: items.map((item) => item.id)
      }
    }],
    crosswordAuthoring: [],
    outputContracts: []
  };
}
