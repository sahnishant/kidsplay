import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import StoryWorld from '../src/ui/StoryWorld.svelte';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';

function emptyStoryProgress(): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: {},
    completedSessionIds: [],
    updatedAt: null
  };
}

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
        onStartMission
      }
    });

    expect(screen.getByRole('heading', { name: 'Where should Mira explore?' })).toBeTruthy();
    expect(screen.getByLabelText('0 story stars')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Mira, story explorer' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Scientu, curious science guide' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Shaitanu, playful challenger' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }));

    expect(screen.getByRole('heading', { name: 'The Puppy by the Pond' })).toBeTruthy();
    expect(screen.getAllByText('Shaitanu').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Scientu').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Mira, can you investigate where different animals belong/)).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Start investigation · 6 clues' }));
    expect(onStartMission).toHaveBeenCalledOnce();
    expect(onStartMission).toHaveBeenCalledWith('mission.puppy-by-pond');
  });

  it('shows completion and mission stars from separate story progress', () => {
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
        onStartMission: vi.fn()
      }
    });

    expect(screen.getByLabelText('3 story stars')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }).textContent).toContain('Mission complete · replay');
  });
});
