import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { TopicProgressSummary } from '../src/runtime/localProgress';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';
import StoryWorld from '../src/ui/StoryWorld.svelte';

function emptyStoryProgress(): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: {},
    completedSessionIds: [],
    updatedAt: null
  };
}

const plantsRecommendation: TopicProgressSummary = {
  id: 'plants',
  label: 'Plants',
  practicedKnowledge: 0,
  strongKnowledge: 0,
  accuracy: null,
  status: 'not_started'
};

const strongPondTopics: TopicProgressSummary[] = [
  { id: 'animals', label: 'Animals', practicedKnowledge: 8, strongKnowledge: 8, accuracy: 0.94, status: 'strong' },
  { id: 'water', label: 'Water', practicedKnowledge: 6, strongKnowledge: 6, accuracy: 0.92, status: 'strong' },
  { id: 'safety', label: 'Safety', practicedKnowledge: 6, strongKnowledge: 5, accuracy: 0.9, status: 'strong' }
];

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('Dheu story-world presentation', () => {
  it('personalizes Dheu, renders the original story cast, opens the pond story and launches the mission by id', async () => {
    const onStartMission = vi.fn();
    render(StoryWorld, {
      props: {
        childName: 'Mira',
        childAvatar: 'fox',
        storyProgress: emptyStoryProgress(),
        recommendedTopics: [],
        topicProgress: [],
        onStartMission,
        onExploreLocation: vi.fn()
      }
    });

    expect(screen.getByRole('heading', { name: 'Where should Mira explore?' })).toBeTruthy();
    expect(screen.getByLabelText('0 story stars')).toBeTruthy();
    expect(screen.getByText('5/9 places open')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Mira, story explorer' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Scientu, curious science guide' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Shaitanu, playful challenger' })).toBeTruthy();

    const lab = screen.getByRole('button', { name: "Scientu's Lab: locked until The Puppy by the Pond" }) as HTMLButtonElement;
    expect(lab.disabled).toBe(true);

    await fireEvent.click(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }));

    expect(screen.getByRole('heading', { name: 'The Puppy by the Pond' })).toBeTruthy();
    expect(screen.getByText('Shaitanu · Warm-up tease')).toBeTruthy();
    expect(screen.getAllByText('Shaitanu').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Scientu').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Mira, can you investigate where different animals belong/)).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Start investigation · 6 clues' }));
    expect(onStartMission).toHaveBeenCalledOnce();
    expect(onStartMission).toHaveBeenCalledWith('mission.puppy-by-pond');
  });

  it('turns ordinary unlocked world locations into expeditions and surfaces Scientu recommendations there', async () => {
    const onExploreLocation = vi.fn();
    render(StoryWorld, {
      props: {
        childName: 'Mira',
        childAvatar: 'fox',
        storyProgress: emptyStoryProgress(),
        recommendedTopics: [plantsRecommendation],
        topicProgress: [plantsRecommendation],
        onStartMission: vi.fn(),
        onExploreLocation
      }
    });

    const farm = screen.getByRole('button', { name: 'Farm: explore' });
    expect(farm.textContent).toContain('Explore this place');
    expect(farm.textContent).toContain('Scientu suggests · Plants');

    await fireEvent.click(farm);
    expect(onExploreLocation).toHaveBeenCalledOnce();
    expect(onExploreLocation).toHaveBeenCalledWith('farm');
  });

  it('unlocks the next story location from story completion while keeping rewards separate', () => {
    const progress: StoryProgressSnapshot = {
      version: 1,
      completedMissions: {
        'mission.puppy-by-pond': {
          missionId: 'mission.puppy-by-pond',
          completedAt: '2026-08-30T14:00:00.000Z',
          completions: 2,
          rewardId: 'badge.pond-helper',
          starsAwarded: 3
        }
      },
      completedSessionIds: ['story-1', 'story-2'],
      updatedAt: '2026-08-30T14:00:00.000Z'
    };

    render(StoryWorld, {
      props: {
        childName: '',
        childAvatar: 'owl',
        storyProgress: progress,
        recommendedTopics: [],
        topicProgress: [],
        onStartMission: vi.fn(),
        onExploreLocation: vi.fn()
      }
    });

    expect(screen.getByLabelText('3 story stars')).toBeTruthy();
    expect(screen.getByText('6/9 places open')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }).textContent).toContain('Mission complete · replay');
    expect((screen.getByRole('button', { name: "Scientu's Lab: The Invisible Air Mystery" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('raises Shaitanu framing for strong topic progress without changing the mission contract', async () => {
    render(StoryWorld, {
      props: {
        childName: 'Mira',
        childAvatar: 'fox',
        storyProgress: emptyStoryProgress(),
        recommendedTopics: [],
        topicProgress: strongPondTopics,
        onStartMission: vi.fn(),
        onExploreLocation: vi.fn()
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }));
    expect(screen.getByText('Shaitanu · Clever trap')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start investigation · 6 clues' })).toBeTruthy();
  });
});
