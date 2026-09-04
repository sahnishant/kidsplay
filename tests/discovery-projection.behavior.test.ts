import { describe, expect, it } from 'vitest';
import {
  projectDiscoveries,
  validateDiscoveryProjectionRules,
  type DiscoveryProjectionRule
} from '../src/experience/discoveryProjection';

const rules: DiscoveryProjectionRule[] = [
  {
    ruleId: 'discovery-rule.forest.rabbit',
    sourceEventRef: 'event.forest.rabbit-found',
    discoveryId: 'discovery.animal.rabbit',
    kind: 'animal_nature',
    canonicalRefs: ['semantic.rabbit', 'kr.animal.rabbit.is-animal'],
    foundAtRef: 'story.location.forest'
  },
  {
    ruleId: 'discovery-rule.forest.word-under',
    sourceEventRef: 'event.forest.under-trace-complete',
    discoveryId: 'discovery.word.under',
    kind: 'vocabulary_semantic',
    canonicalRefs: ['sense.under.below-reference'],
    foundAtRef: 'story.location.forest'
  },
  {
    ruleId: 'discovery-rule.forest.field-note',
    sourceEventRef: 'event.forest.level-1-complete',
    discoveryId: 'discovery.note.forest-1',
    kind: 'field_note',
    canonicalRefs: ['story.mission.forest-explorer-1'],
    foundAtRef: 'story.location.forest'
  }
];

describe('Discovery Book deterministic projection', () => {
  it('projects canonical discoveries from completed events without independent counters or currency', () => {
    expect(projectDiscoveries(rules, [
      'event.forest.rabbit-found',
      'event.forest.level-1-complete'
    ])).toEqual([
      {
        discoveryId: 'discovery.animal.rabbit',
        kind: 'animal_nature',
        canonicalRefs: ['semantic.rabbit', 'kr.animal.rabbit.is-animal'],
        sourceEventRef: 'event.forest.rabbit-found',
        foundAtRef: 'story.location.forest'
      },
      {
        discoveryId: 'discovery.note.forest-1',
        kind: 'field_note',
        canonicalRefs: ['story.mission.forest-explorer-1'],
        sourceEventRef: 'event.forest.level-1-complete',
        foundAtRef: 'story.location.forest'
      }
    ]);
  });

  it('cannot farm duplicate discoveries by replaying the same event ref', () => {
    expect(projectDiscoveries(rules, [
      'event.forest.rabbit-found',
      'event.forest.rabbit-found',
      'event.forest.rabbit-found'
    ])).toHaveLength(1);
  });

  it('is deterministic regardless of completed-event ordering', () => {
    const a = projectDiscoveries(rules, [
      'event.forest.level-1-complete',
      'event.forest.rabbit-found',
      'event.forest.under-trace-complete'
    ]);
    const b = projectDiscoveries(rules, [
      'event.forest.under-trace-complete',
      'event.forest.rabbit-found',
      'event.forest.level-1-complete'
    ]);
    expect(a).toEqual(b);
  });

  it('requires one projection rule per discovery and explicit canonical refs', () => {
    expect(() => validateDiscoveryProjectionRules([
      rules[0],
      { ...rules[1], discoveryId: rules[0].discoveryId }
    ])).toThrow(/exactly one projection rule/);

    expect(() => validateDiscoveryProjectionRules([
      { ...rules[0], canonicalRefs: [] }
    ])).toThrow(/canonicalRefs must be non-empty/);
  });
});
