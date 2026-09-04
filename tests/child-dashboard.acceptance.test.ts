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
  it('makes Continue Adventure primary and keeps adult progress and assessment navigation off the child home', () => {
    render(App);

    expect(screen.getByRole('button', { name: 'Continue Adventure' })).toBeTruthy();
    expect(screen.getByText('CONTINUE ADVENTURE')).toBeTruthy();
    expect(screen.getByLabelText('Current adventure level 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open practice activities' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open learning progress' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open goal learning' })).toBeNull();
    expect(screen.queryByText('OLYMPIAD CHALLENGE')).toBeNull();
    expect(screen.queryByText(/Curriculum profile:/)).toBeNull();
  });

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

  it('moves progress, mocks and curriculum profile metadata behind the grown-up area', async () => {
    render(App);

    await fireEvent.click(screen.getByRole('button', { name: 'Open player settings' }));
    expect(screen.getByText('For grown-ups')).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Open grown-up area' }));

    expect(screen.getByRole('heading', { name: 'Learning progress' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Grown-up sections' })).toBeTruthy();
    expect(await screen.findByText('Numbers for grown-ups')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Assessment' }));
    expect(screen.getByRole('heading', { name: 'Assessment & mocks' })).toBeTruthy();
    expect(await screen.findByText('OLYMPIAD CHALLENGE')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /% ready$/ })).toBeTruthy();
    expect(screen.getByLabelText('Learn, practise, mock journey')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start mock ▶' })).toBeTruthy();
    expect(screen.getByText('ⓘ About readiness')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Programmes' }));
    expect(screen.getByRole('heading', { name: 'Programmes & profiles' })).toBeTruthy();
    expect(screen.getAllByText(/Curriculum profile:/).length).toBeGreaterThan(0);
  });
});
