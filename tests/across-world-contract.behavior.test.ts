import { describe, expect, it } from 'vitest';
import { validateAcrossWorldCampaign } from '../src/experience/acrossWorldContract';

const indiaSlice = {
  schemaVersion: 1 as const,
  campaignId: 'campaign.across-world.v1',
  localWorldLocationRefs: [
    'story.location.home',
    'story.location.garden',
    'story.location.farm',
    'story.location.forest',
    'story.location.river',
    'story.location.road-school',
    'story.location.scientu-lab',
    'story.location.observatory',
    'story.location.shaitanu-hideout'
  ],
  geographicNodes: [
    { nodeId: 'geo.world', type: 'world', childName: 'Our World' },
    { nodeId: 'geo.country.india', type: 'country', parentNodeId: 'geo.world', childName: 'India' },
    { nodeId: 'geo.city.delhi', type: 'city', parentNodeId: 'geo.country.india', childName: 'Delhi' },
    { nodeId: 'geo.city.agra', type: 'city', parentNodeId: 'geo.country.india', childName: 'Agra' },
    { nodeId: 'geo.destination.red-fort', type: 'destination', parentNodeId: 'geo.city.delhi', childName: 'Red Fort' },
    { nodeId: 'geo.destination.taj-mahal', type: 'destination', parentNodeId: 'geo.city.agra', childName: 'Taj Mahal' }
  ],
  routes: [
    {
      routeId: 'route.delhi.red-fort',
      fromNodeId: 'geo.city.delhi',
      toNodeId: 'geo.destination.red-fort',
      admissibleTravelModes: ['bus'],
      travelModeRationaleRefs: { bus: 'travel.rationale.local-road-route' },
      actionFamilies: ['board', 'observe'],
      firstPlayCompatible: true
    },
    {
      routeId: 'route.delhi.agra',
      fromNodeId: 'geo.city.delhi',
      toNodeId: 'geo.city.agra',
      admissibleTravelModes: ['train', 'car_taxi'],
      travelModeRationaleRefs: {
        train: 'travel.rationale.intercity-rail',
        car_taxi: 'travel.rationale.intercity-road'
      },
      actionFamilies: ['route_follow', 'observe'],
      firstPlayCompatible: true
    },
    {
      routeId: 'route.agra.taj-mahal',
      fromNodeId: 'geo.city.agra',
      toNodeId: 'geo.destination.taj-mahal',
      admissibleTravelModes: ['bus'],
      travelModeRationaleRefs: { bus: 'travel.rationale.local-road-route' },
      actionFamilies: ['board', 'observe'],
      firstPlayCompatible: true
    }
  ],
  destinations: [
    {
      destinationId: 'destination.red-fort',
      geoNodeId: 'geo.destination.red-fort',
      childName: 'Red Fort',
      archetype: 'landmark',
      canonicalKnowledgeRefs: ['kr.place.red-fort.reviewed-core'],
      routeRefs: ['route.delhi.red-fort'],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['recipe.explore', 'recipe.guess'],
      discoveryProjectionRef: 'discovery.place.red-fort',
      learnAboutTopicRefs: ['topic.place.red-fort']
    },
    {
      destinationId: 'destination.taj-mahal',
      geoNodeId: 'geo.destination.taj-mahal',
      childName: 'Taj Mahal',
      archetype: 'landmark',
      canonicalKnowledgeRefs: ['kr.place.taj-mahal.reviewed-core'],
      routeRefs: ['route.agra.taj-mahal'],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['recipe.explore'],
      discoveryProjectionRef: 'discovery.place.taj-mahal'
    }
  ]
};

describe('Across the World route/destination contract', () => {
  it('preserves a separate local-world foundation while validating a generic geographic graph', () => {
    const campaign = validateAcrossWorldCampaign(indiaSlice);
    expect(campaign.localWorldLocationRefs).toHaveLength(9);
    expect(campaign.geographicNodes.filter((node) => node.type === 'world')).toHaveLength(1);
    expect(campaign.destinations.map((destination) => destination.destinationId)).toEqual([
      'destination.red-fort',
      'destination.taj-mahal'
    ]);
  });

  it('keeps destination truth/evaluation/currency out of campaign metadata', () => {
    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      destinations: [{ ...indiaSlice.destinations[0], facts: ['A copied landmark fact'] }]
    })).toThrow(/may not own it/);

    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      coins: 100
    })).toThrow(/may not own it/);

    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      destinations: [{ ...indiaSlice.destinations[0], evaluatorId: 'destination-evaluator' }]
    })).toThrow(/may not own it/);
  });

  it('requires a rationale for every admitted travel mode instead of random vehicle rewards', () => {
    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      routes: [{
        ...indiaSlice.routes[0],
        admissibleTravelModes: ['bus', 'helicopter'],
        travelModeRationaleRefs: { bus: 'travel.rationale.local-road-route' }
      }]
    })).toThrow(/travelModeRationaleRefs.helicopter/);
  });

  it('restricts First Play routes to simple board/pack/route/observe actions', () => {
    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      routes: [{
        ...indiaSlice.routes[0],
        actionFamilies: ['board', 'connect'],
        firstPlayCompatible: true
      }]
    })).toThrow(/First Play route contains a higher-demand action/);
  });

  it('fails closed on unknown graph, route and destination references', () => {
    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      geographicNodes: [
        ...indiaSlice.geographicNodes,
        { nodeId: 'geo.destination.orphan', type: 'destination', parentNodeId: 'geo.city.missing', childName: 'Orphan' }
      ]
    })).toThrow(/unknown parent/);

    expect(() => validateAcrossWorldCampaign({
      ...indiaSlice,
      destinations: [{ ...indiaSlice.destinations[0], routeRefs: ['route.missing'] }]
    })).toThrow(/unknown route ref/);
  });
});
