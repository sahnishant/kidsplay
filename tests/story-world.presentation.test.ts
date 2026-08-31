import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { TopicProgressSummary } from '../src/runtime/localProgress';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';
import StoryWorld from '../src/ui/StoryWorldViewport.svelte';

function emptyStoryProgress(): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: {},
    completedSessionIds: [],
    updatedAt: null
  };
}

async function advanceMissionStory(): Promise<void> {
  while (screen.queryByRole('button', { name: 'Next story beat' })) {
    await fireEvent.click(screen.getByRole('button', { name: 'Next story beat' }));
  }
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

describe('Dheu viewport story-world presentation', () => {
  it('personalizes Dheu, reveals mission story one click at a time and launches the mission by id', async () => {
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
    expect(screen.getByLabelText('5 of 9 places open')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    const lab = screen.getByRole('button', { name: "Scientu's Lab: locked until The Puppy by the Pond" }) as HTMLButtonElement;
    expect(lab.disabled).toBe(true);

    await fireEvent.click(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The Puppy by the Pond' })).toBeTruthy();
    expect(screen.getByText(/STORY MISSION · Warm-up tease/)).toBeTruthy();
    expect(screen.getByLabelText(/Story beat 1 of/)).toBeTruthy();
    expect(screen.getByText(/Mira, can you investigate where different animals belong/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start investigation · 6 clues' })).toBeNull();

    await advanceMissionStory();
    expect(screen.getByRole('button', { name: 'Start investigation · 6 clues' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Start investigation · 6 clues' }));
    expect(onStartMission).toHaveBeenCalledOnce();
    expect(onStartMission).toHaveBeenCalledWith('mission.puppy-by-pond');
  });

  it('turns ordinary unlocked world locations into expeditions and surfaces recommendations compactly', async () => {
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
    expect(farm.textContent).toContain('Try next');

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
    expect(screen.getByLabelText('6 of 9 places open')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }).textContent).toContain('Replay');
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
    expect(screen.getByText(/STORY MISSION · Clever trap/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next story beat' })).toBeTruthy();
  });
});
