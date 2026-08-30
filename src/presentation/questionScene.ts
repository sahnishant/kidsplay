import type { Question } from '../contracts/question';

/**
 * Presentation-only scene reuse for questions that do not need a visual stimulus
 * to define their answer contract. Keeping this map outside the question/engine
 * schema lets generated questions gain lightweight motion without coupling
 * canonical knowledge or evaluators to artwork.
 */
const sceneByKnowledgeRef = new Map<string, string>([
  ['kr.animals.dog.domestic', 'scene.dog.happy-bone'],
  ['kr.air.balloon.contains.air', 'scene.air.balloon-candle'],
  ['kr.air.candle.need.air', 'scene.air.balloon-candle'],
  ['kr.rocks.pumice.feature.light', 'scene.rocks.pumice-water']
]);

const sceneByConceptId = new Map<string, string>([
  ['animals.dog.habitat', 'scene.dog.happy-bone'],
  ['animals.whale.habitat', 'scene.whale.swimming'],
  ['rocks.types.pumice', 'scene.rocks.pumice-water']
]);

export function resolveQuestionSceneId(question: Question): string | null {
  if (question.stimulus?.type === 'scene') return question.stimulus.sceneId;

  for (const knowledgeRef of question.knowledgeRefs ?? []) {
    const sceneId = sceneByKnowledgeRef.get(knowledgeRef);
    if (sceneId) return sceneId;
  }

  for (const conceptId of question.conceptIds) {
    const sceneId = sceneByConceptId.get(conceptId);
    if (sceneId) return sceneId;
  }

  return null;
}
