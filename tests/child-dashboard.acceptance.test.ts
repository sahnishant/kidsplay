import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import App from '../src/App.svelte';
import type { ProgressSummary } from '../src/runtime/localProgress';
import ProgressViewport from '../src/ui/home/ProgressViewport.svelte';

const focusedProgress: ProgressSummary = {
  totalAttempts: 12,
  correctAttempts: 10,
  accuracy: 10 / 12,
  practicedKnowledge: 9,
  masteredKnowledge: 6,
  topics: [
    {
      id: 'animals',
      label: 'Animals',
      practicedKnowledge: 6,
      strongKnowledge: 5,
      accuracy: 0.9,
      status: 'strong'
    },
    {
      id: 'safety',
      label: 'Safety',
      practicedKnowledge: 3,
      strongKnowledge: 1,
      accuracy: 2 / 3,
      status: 'needs_practice'
    }
  ],
  recommendedTopics: [
    {
      id: 'safety',
      label: 'Safety',
      practicedKnowledge: 3,
      strongKnowledge: 1,
      accuracy: 2 / 3,
      status: 'needs_practice'
    }
  ]
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanup();
});

describe('child dashboard acceptance surfaces', () => {
  it('puts strong facts and adaptive next focus ahead of analytics while keeping topic state explicit', () => {
    const { container } = render(ProgressViewport, { props: { progress: focusedProgress } });

    expect(screen.getByRole('heading', { name: '6 strong facts!' })).toBeTruthy();
    expect(screen.getByText('SCIENTU SAYS')).toBeTruthy();
    expect(screen.getByRole('heading', { name: "Let's make these stronger!" })).toBeTruthy();
    expect(screen.getByLabelText('Safety: Practise next')).toBeTruthy();
    expect(screen.getByLabelText(/Animals\. Strong\. 5 strong of 6 practised/)).toBeTruthy();
    expect(container.querySelector('[data-status="strong"] .topic-tile__stars')?.textContent).toBe('★★★');
    expect(container.querySelector('[data-status="needs_practice"] .topic-tile__stars')?.textContent).toBe('★☆☆');
    expect(screen.getByText('Numbers for grown-ups')).toBeTruthy();
  });

  it('leads Goals with the child challenge journey when there is no saved mock', async () => {
    render(App);

    await fireEvent.click(screen.getByRole('button', { name: 'Open goal learning' }));

    expect(screen.getByRole('heading', { name: 'Goal learning' })).toBeTruthy();
    expect(screen.getByText('OLYMPIAD CHALLENGE')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /% ready$/ })).toBeTruthy();
    expect(screen.getByLabelText('Learn, practise, mock journey')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start mock ▶' })).toBeTruthy();
    expect(screen.getByText('ⓘ About readiness')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Pick up where you left off' })).toBeNull();
  });
});
