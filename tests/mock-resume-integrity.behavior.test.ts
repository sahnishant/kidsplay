import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import App from '../src/App.svelte';
import { createSessionForCatalogEntry, getCatalogEntries } from '../src/content';
import type { Question } from '../src/contracts/question';
import {
  getPatternMockContractSignature,
  getQuestionContractSignature
} from '../src/runtime/mockContract';
import { loadMockCheckpoint, saveMockCheckpoint } from '../src/runtime/mockPersistence';

async function openAssessment(): Promise<void> {
  await fireEvent.click(screen.getByRole('button', { name: 'Open player settings' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Open grown-up area' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Assessment' }));
}

describe('mock resume contract integrity', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('fingerprints the same assessment and question contracts deterministically', () => {
    const patternEntry = getCatalogEntries().find((entry) => entry.actionLabel === 'Try 35-question mock');
    expect(patternEntry).toBeTruthy();
    const launch = createSessionForCatalogEntry(patternEntry!.id, {});

    expect(getPatternMockContractSignature(launch.profileRef)).toBe(
      getPatternMockContractSignature(launch.profileRef)
    );
    expect(getQuestionContractSignature(launch.questions)).toBe(
      getQuestionContractSignature([...launch.questions])
    );
    expect(() => getPatternMockContractSignature('OTHER_PROFILE')).toThrow(/cannot fingerprint/i);
  });

  it('changes the selected-question fingerprint when learning content changes without a revision bump', () => {
    const patternEntry = getCatalogEntries().find((entry) => entry.actionLabel === 'Try 35-question mock');
    expect(patternEntry).toBeTruthy();
    const launch = createSessionForCatalogEntry(patternEntry!.id, {});
    const originalSignature = getQuestionContractSignature(launch.questions);
    const changedQuestions = JSON.parse(JSON.stringify(launch.questions)) as Question[];
    changedQuestions[0].prompt.text = `${changedQuestions[0].prompt.text} changed`;

    expect(getQuestionContractSignature(changedQuestions)).not.toBe(originalSignature);
  });

  it('clears and refuses a saved mock when its selected-question contract is stale', async () => {
    const patternEntry = getCatalogEntries().find((entry) => entry.actionLabel === 'Try 35-question mock');
    expect(patternEntry).toBeTruthy();
    const launch = createSessionForCatalogEntry(patternEntry!.id, {});

    saveMockCheckpoint({
      entryId: patternEntry!.id,
      title: launch.title,
      questionIds: launch.questions.map((question) => question.id),
      sectionSignature: getPatternMockContractSignature(launch.profileRef),
      questionSignature: `${getQuestionContractSignature(launch.questions)}:stale`,
      state: {
        sessionId: 'session.stale-contract',
        index: 0,
        responses: [],
        submitted: false
      }
    });

    render(App);
    expect(screen.queryByRole('heading', { name: 'Pick up where you left off' })).toBeNull();
    await openAssessment();
    expect(screen.getByRole('heading', { name: 'Assessment & mocks' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: /Continue/ }));

    expect(screen.getByRole('alert').textContent).toMatch(/one or more saved questions changed/i);
    expect(screen.queryByRole('heading', { name: 'Pick up where you left off' })).toBeNull();
    expect(loadMockCheckpoint()).toBeNull();
    expect(screen.getByRole('heading', { name: 'Assessment & mocks' })).toBeTruthy();
  });

  it('preserves a valid saved mock when unified back exits the resumed session', async () => {
    const patternEntry = getCatalogEntries().find((entry) => entry.actionLabel === 'Try 35-question mock');
    expect(patternEntry).toBeTruthy();
    const launch = createSessionForCatalogEntry(patternEntry!.id, {});

    saveMockCheckpoint({
      entryId: patternEntry!.id,
      title: launch.title,
      questionIds: launch.questions.map((question) => question.id),
      sectionSignature: getPatternMockContractSignature(launch.profileRef),
      questionSignature: getQuestionContractSignature(launch.questions),
      state: {
        sessionId: 'session.back-preserved',
        index: 0,
        responses: [],
        submitted: false
      }
    });

    render(App);
    await openAssessment();
    await fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText('Saved on this device')).toBeTruthy();

    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy());

    expect(loadMockCheckpoint()?.state.sessionId).toBe('session.back-preserved');
    await openAssessment();
    expect(screen.getByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy();
  });
});
