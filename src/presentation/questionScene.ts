import type { Question } from '../contracts/question';

/**
 * Presentation-only scene reuse for questions that do not need a visual stimulus
 * to define their answer contract. Keeping this map outside the question/engine
 * schema lets generated questions gain lightweight motion without coupling
 * canonical knowledge or evaluators to artwork.
 */
const sceneByKnowledgeRef = new Map<string, string>([
  ['kr.animals.dog.domestic', 'scene.dog.happy-bone'],
  ['kr.human.lungs.function.breathe', 'scene.human.lungs-breathing'],
  ['kr.air.moving.name.wind', 'scene.air.kite-wind'],
  ['kr.air.balloon.contains.air', 'scene.air.balloon-candle'],
  ['kr.air.breathing.need.air', 'scene.human.lungs-breathing'],
  ['kr.air.candle.need.air', 'scene.air.balloon-candle'],
  ['kr.air.windmill.turned-by.wind', 'scene.air.windmill'],
  ['kr.air.kite.moved-by.wind', 'scene.air.kite-wind'],
  ['kr.air.sailboat.moved-by.wind', 'scene.air.sailboat-wind'],
  ['kr.water.sea.feature.salty', 'scene.water.sea-salty'],
  ['kr.rocks.pumice.feature.light', 'scene.rocks.pumice-water'],
  ['kr.plants.general.air.cool-fresh', 'scene.plants.air-fresh']
]);

const sceneByConceptId = new Map<string, string>([
  ['animals.dog.habitat', 'scene.dog.happy-bone'],
  ['animals.whale.habitat', 'scene.whale.swimming'],
  ['human.organs.lungs', 'scene.human.lungs-breathing'],
  ['air.properties.wind', 'scene.air.kite-wind'],
  ['air.properties.windmill', 'scene.air.windmill'],
  ['air.properties.kite', 'scene.air.kite-wind'],
  ['air.properties.sailboat', 'scene.air.sailboat-wind'],
  ['water.sources.sea', 'scene.water.sea-salty'],
  ['rocks.types.pumice', 'scene.rocks.pumice-water'],
  ['plants.importance.air', 'scene.plants.air-fresh']
]);

const dashboardSceneByTopic = new Map<string, string>([
  ['animals', 'scene.dog.happy-bone'],
  ['plants', 'scene.plants.air-fresh'],
  ['human', 'scene.human.lungs-breathing'],
  ['air', 'scene.air.windmill'],
  ['water', 'scene.water.sea-salty'],
  ['rocks', 'scene.rocks.pumice-water']
]);

/**
 * Explicit authored scene stimuli are always authoritative. Inferred scenes are
 * a learning/presentation aid and can be disabled by assessment surfaces so a
 * decorative cue never leaks the answer in a mock.
 */
export function resolveQuestionSceneId(question: Question, allowInferredScene = true): string | null {
  if (question.stimulus?.type === 'scene') return question.stimulus.sceneId;
  if (!allowInferredScene) return null;

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

/**
 * Used by validation/tests to guarantee that presentation mappings cannot drift
 * away from the scene registry. Returns a copy so callers cannot mutate maps.
 */
export function getReferencedPresentationSceneIds(): string[] {
  return [...new Set([
    ...sceneByKnowledgeRef.values(),
    ...sceneByConceptId.values(),
    ...dashboardSceneByTopic.values()
  ])].sort();
}
