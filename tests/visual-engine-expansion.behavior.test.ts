import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { HotspotQuestion, MemoryPairsQuestion, SequenceOrderQuestion } from '../src/contracts/question';
import type { EvaluationResult } from '../src/contracts/runtime';
import Hotspot from '../src/engines/Hotspot.svelte';
import MemoryPairs from '../src/engines/MemoryPairs.svelte';
import SequenceOrder from '../src/engines/SequenceOrder.svelte';

const passResult: EvaluationResult = {
  correct: true,
  score: 1,
  maxScore: 1,
  feedbackKey: 'correct',
  masteryEvidence: [],
  knowledgeEvidence: []
};

afterEach(() => cleanup());

describe('semantic visuals across reusable engines', () => {
  it('renders exact semantic card visuals in memory pairs without changing card labels', () => {
    const question: MemoryPairsQuestion = {
      id: 'test.visual.memory.001',
      revision: 1,
      schemaVersion: 1,
      conceptIds: ['test.visual'],
      difficulty: 1,
      language: 'en',
      prompt: { text: 'Find the pairs.' },
      feedback: { correct: 'Correct.', incorrect: 'Try again.' },
      authoring: { status: 'reviewed', source: 'behavior-test' },
      interaction: {
        type: 'memory_pairs',
        version: 1,
        seed: 1,
        cards: [
          { id: 'dog', label: 'Dog' },
          { id: 'land', label: 'Land' },
          { id: 'whale', label: 'Whale' },
          { id: 'water', label: 'Water' }
        ]
      },
      solution: { type: 'pair_matches', pairs: [['dog', 'land'], ['whale', 'water']] }
    };

    const { container } = render(MemoryPairs, {
      props: { question, onSubmit: () => undefined, checkResponse: () => passResult }
    });

    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(container.querySelector('[data-visual-ref="entity.animal.dog"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.whale"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.habitat.land"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.habitat.water"]')).toBeTruthy();
  });

  it('renders every authored butterfly lifecycle stage as reusable SVG art', () => {
    const question: SequenceOrderQuestion = {
      id: 'test.visual.sequence.001',
      revision: 1,
      schemaVersion: 1,
      conceptIds: ['test.visual'],
      difficulty: 1,
      language: 'en',
      prompt: { text: 'Put the stages in order.' },
      feedback: { correct: 'Correct.', incorrect: 'Try again.' },
      authoring: { status: 'reviewed', source: 'behavior-test' },
      interaction: {
        type: 'sequence_order',
        version: 1,
        seed: 2,
        items: [
          { id: 'egg', label: 'Egg', visualRefs: ['entity.lifecycle.egg'] },
          { id: 'caterpillar', label: 'Caterpillar', visualRefs: ['entity.lifecycle.caterpillar'] },
          { id: 'chrysalis', label: 'Chrysalis', visualRefs: ['entity.lifecycle.chrysalis'] },
          { id: 'butterfly', label: 'Butterfly', visualRefs: ['entity.animal.butterfly'] }
        ]
      },
      solution: { type: 'ordered_items', orderedItemIds: ['egg', 'caterpillar', 'chrysalis', 'butterfly'] }
    };

    const { container } = render(SequenceOrder, {
      props: { question, onSubmit: () => undefined, checkResponse: () => passResult }
    });

    expect(container.querySelectorAll('[data-visual-ref]').length).toBe(4);
    expect(container.querySelector('[data-visual-ref="entity.lifecycle.egg"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.lifecycle.caterpillar"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.lifecycle.chrysalis"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.butterfly"]')).toBeTruthy();
  });

  it('replaces hotspot emoji art with semantic dog and whale visuals while keeping accessible labels', () => {
    const question: HotspotQuestion = {
      id: 'test.visual.hotspot.001',
      revision: 1,
      schemaVersion: 1,
      conceptIds: ['test.visual'],
      difficulty: 1,
      language: 'en',
      prompt: { text: 'Tap the water animal.' },
      feedback: { correct: 'Correct.', incorrect: 'Try again.' },
      authoring: { status: 'reviewed', source: 'behavior-test' },
      interaction: {
        type: 'hotspot',
        version: 1,
        selectionMode: 'single',
        board: {
          ariaLabel: 'Dog and whale',
          theme: 'split-land-water',
          regions: [
            {
              id: 'dog',
              label: 'Dog',
              symbol: '🐶',
              visualRefs: ['entity.animal.dog'],
              shape: { type: 'circle', centerX: 0.25, centerY: 0.55, radius: 0.15 }
            },
            {
              id: 'whale',
              label: 'Whale',
              symbol: '🐋',
              visualRefs: ['entity.animal.whale'],
              shape: { type: 'circle', centerX: 0.75, centerY: 0.55, radius: 0.15 }
            }
          ]
        }
      },
      solution: { type: 'selected_regions', correctRegionIds: ['whale'] }
    };

    const { container } = render(Hotspot, {
      props: { question, onSubmit: () => undefined, checkResponse: () => passResult }
    });

    expect(screen.getByRole('button', { name: 'Dog' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Whale' })).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.dog"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.whale"]')).toBeTruthy();
  });
});
