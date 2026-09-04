import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { ProgressSummary, TopicId, TopicProgressSummary } from '../src/runtime/localProgress';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';
import { deriveWorldRewardState } from '../src/story/worldRewards';
import StoryWorld from '../src/ui/StoryWorldViewport.svelte';

function topic(id: TopicId, status: TopicProgressSummary['status']): TopicProgressSummary {
  return {
    id,
    label: id,
    practicedKnowledge: 6,
    strongKnowledge: status === 'strong' ? 5 : 2,
    accuracy: status === 'strong' ? 0.9 : 0.78,
    status
  };
}

function richProgress(): ProgressSummary {
  return {
    totalAttempts: 20,
    correctAttempts: 18,
    accuracy: 0.9,
    practicedKnowledge: 20,
    masteredKnowledge: 12,
    topics: [
      topic('animals', 'growing'),
      topic('plants', 'strong'),
      topic('water', 'strong'),
      topic('safety', 'strong'),
      topic('transport', 'growing'),
      topic('air', 'growing'),
      topic('reasoning', 'strong'),
      topic('universe', 'strong')
    ],
    recommendedTopics: []
  };
}

function emptyStoryProgress(): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: {},
    completedLocations: {},
    completedSessionIds: [],
    updatedAt: null
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => cleanup());

describe('Phase E world consequences', () => {
  it('keeps progress-derived location changes and keepsakes visible without a star currency', () => {
    const worldState = deriveWorldRewardState(richProgress());

    render(StoryWorld, {
      props: {
        childName: 'Mira',
        childAvatar: 'fox',
        storyProgress: emptyStoryProgress(),
        worldState,
        recommendedTopics: [],
        topicProgress: richProgress().topics,
        onStartMission: vi.fn(),
        onExploreLocation: vi.fn()
      }
    });

    const forest = screen.getByRole('button', {
      name: /Forest Explorer Trail, Level 1: play next\. Learning changed this place: Trail sign repaired, Forest animals return, Saplings take root\./
    });
    expect(forest.textContent).toContain('🪧🦌🌱');

    expect(screen.queryByLabelText('Learning has changed the world')).toBeNull();
    expect(screen.getByLabelText('Persistent learning keepsakes')).toBeTruthy();
    expect(screen.getByLabelText(/Backpack collectibles:/)).toBeTruthy();
    expect(screen.getByLabelText(/Lab and science discoveries:/)).toBeTruthy();
    expect(screen.getByLabelText(/Puzzle trophies:/)).toBeTruthy();
    expect(screen.queryByText(/stars/i)).toBeNull();
  });
});
