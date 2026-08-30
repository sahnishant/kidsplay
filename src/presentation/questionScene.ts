import type { Question } from '../contracts/question';

/**
 * Presentation-only scene reuse for questions that do not need a visual stimulus
 * to define their answer contract. Keeping this map outside the question/engine
 * schema lets generated questions gain lightweight motion without coupling
 * canonical knowledge or evaluators to artwork.
 */
const sceneByKnowledgeRef = new Map<string, string>([
  ['kr.animals.dog.domestic', 'scene.dog.happy-bone'],
  ['kr.air.moving.name.wind', 'scene.air.kite-wind'],
  ['kr.air.balloon.contains.air', 'scene.air.balloon-candle'],
  ['kr.air.candle.need.air', 'scene.air.balloon-candle'],
  ['kr.air.windmill.turned-by.wind', 'scene.air.windmill'],
  ['kr.water.sea.feature.salty', 'scene.water.sea-salty'],
  ['kr.rocks.pumice.feature.light', 'scene.rocks.pumice-water'],
  ['kr.plants.general.air.cool-fresh', 'scene.plants.air-fresh']
]);

const sceneByConceptId = new Map<string, string>([
  ['animals.dog.habitat', 'scene.dog.happy-bone'],
  ['animals.whale.habitat', 'scene.whale.swimming'],
  ['air.properties.wind', 'scene.air.kite-wind'],
  ['air.properties.windmill', 'scene.air.windmill'],
  ['water.sources.sea', 'scene.water.sea-salty'],
  ['rocks.types.pumice', 'scene.rocks.pumice-water'],
  ['plants.importance.air', 'scene.plants.air-fresh']
]);

const dashboardSceneByTopic = new Map<string, string>([
  ['animals', 'scene.dog.happy-bone'],
  ['plants', 'scene.plants.air-fresh'],
  ['air', 'scene.air.windmill'],
  ['water', 'scene.water.sea-salty'],
  ['rocks', 'scene.rocks.pumice-water']
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

export function resolveDashboardSceneId(topicId?: string): string | null {
  return topicId ? dashboardSceneByTopic.get(topicId) ?? null : null;
}
