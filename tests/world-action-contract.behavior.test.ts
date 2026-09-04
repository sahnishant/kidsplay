import { describe, expect, it } from 'vitest';
import { validateWorldActionDefinition } from '../src/experience/worldActionContract';

describe('G3/G4 reusable world action contract', () => {
  it('accepts a bounded practical-life action that references canonical goals and semantic targets', () => {
    expect(validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.forest.feed-rabbit',
      family: 'practical_life',
      action: 'feed',
      canonicalGoalRefs: ['kr.animal.rabbit.food.reviewed'],
      subjectSemanticRefs: ['semantic.food.carrot'],
      targetSemanticRefs: ['semantic.rabbit'],
      evidenceClass: 'guided_practice',
      retryPolicy: 'not_applicable'
    })).toMatchObject({
      family: 'practical_life',
      action: 'feed',
      evidenceClass: 'guided_practice'
    });
  });

  it('requires cause/effect play to name an explicit canonical state transition', () => {
    expect(() => validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.garden.grow-plant',
      family: 'cause_effect',
      action: 'grow',
      canonicalGoalRefs: ['kr.plant.growth.reviewed'],
      subjectSemanticRefs: ['semantic.seed'],
      evidenceClass: 'exploration',
      retryPolicy: 'not_applicable'
    })).toThrow(/requires an explicit canonical state transition/);

    expect(validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.garden.grow-plant',
      family: 'cause_effect',
      action: 'grow',
      canonicalGoalRefs: ['kr.plant.growth.reviewed'],
      subjectSemanticRefs: ['semantic.seed'],
      stateTransition: {
        beforeStateRef: 'state.seed.dry',
        afterStateRef: 'state.seed.sprout',
        causalKnowledgeRef: 'kr.plant.germination.water-growth'
      },
      evidenceClass: 'exploration',
      retryPolicy: 'not_applicable'
    }).stateTransition).toEqual({
      beforeStateRef: 'state.seed.dry',
      afterStateRef: 'state.seed.sprout',
      causalKnowledgeRef: 'kr.plant.germination.water-growth'
    });
  });

  it('keeps action families semantically bounded instead of accepting arbitrary level-script verbs', () => {
    expect(() => validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.custom.fly-around',
      family: 'practical_life',
      action: 'fly' as never,
      canonicalGoalRefs: ['kr.transport.flight'],
      subjectSemanticRefs: ['semantic.plane'],
      evidenceClass: 'exploration',
      retryPolicy: 'not_applicable'
    })).toThrow(/not a practical-life action/);
  });

  it('requires targets when the action meaning depends on where or to whom the object goes', () => {
    expect(() => validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.pack.bag',
      family: 'practical_life',
      action: 'pack',
      canonicalGoalRefs: ['kr.practical.pack'],
      subjectSemanticRefs: ['semantic.book'],
      evidenceClass: 'guided_practice',
      retryPolicy: 'not_applicable'
    })).toThrow(/pack requires an explicit target/);

    expect(() => validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.sort.recycling',
      family: 'practical_life',
      action: 'sort',
      canonicalGoalRefs: ['kr.environment.sort-materials'],
      subjectSemanticRefs: ['semantic.paper', 'semantic.plastic'],
      evidenceClass: 'guided_practice',
      retryPolicy: 'not_applicable'
    })).toThrow(/sort requires explicit semantic targets/);
  });

  it('preserves #173 first-attempt truth only when the action is explicitly evaluative', () => {
    expect(() => validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.safety.crossing',
      family: 'practical_life',
      action: 'safety_choice',
      canonicalGoalRefs: ['kr.safety.crossing.reviewed'],
      subjectSemanticRefs: ['semantic.child'],
      targetSemanticRefs: ['semantic.crossing'],
      evidenceClass: 'evaluative',
      retryPolicy: 'not_applicable'
    })).toThrow(/must preserve first-attempt evidence/);

    expect(() => validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'world-action.garden.water-free-play',
      family: 'practical_life',
      action: 'water',
      canonicalGoalRefs: ['kr.plant.water.reviewed'],
      subjectSemanticRefs: ['semantic.water'],
      targetSemanticRefs: ['semantic.plant'],
      evidenceClass: 'exploration',
      retryPolicy: 'reset_for_retry_preserve_first_attempt'
    })).toThrow(/may not manufacture retry\/mastery semantics/);
  });
});
