import storyCandidatesJson from '../../content/stories/v1-candidates.json';
import { applyStoryV1HumanApproval } from './storyHumanApproval';
import { resolveStoryLexicalProfile } from './storyLexicalReport';
import { isStoryPublishable, validateStoryManifest, type StoryManifest } from './storiesContract';

const storyCandidate = (value: unknown): StoryManifest => {
  const manifest = validateStoryManifest(value);
  if (!resolveStoryLexicalProfile(manifest.lexicalProfileRef)) {
    throw new Error(`${manifest.storyId}: unknown story lexical profile ${manifest.lexicalProfileRef}`);
  }
  return applyStoryV1HumanApproval(manifest);
};

/**
 * Authored source manuscripts. The canonical prose lives in
 * content/stories/v1-candidates.json so browser Stories can load the same
 * bundled asset without embedding every manuscript in the startup JS chunk.
 * Human editorial promotion is an explicit, source-pinned overlay; future
 * draft manuscripts remain non-publishable until separately approved.
 */
export const STORY_CANDIDATES_V1: readonly StoryManifest[] = (storyCandidatesJson as unknown[]).map(storyCandidate);

export const PUBLISHED_STORIES_V1: readonly StoryManifest[] = STORY_CANDIDATES_V1.filter(isStoryPublishable);

export function getStoryCandidate(storyId: string): StoryManifest | undefined {
  return STORY_CANDIDATES_V1.find((manifest) => manifest.storyId === storyId);
}

export function getPublishedStory(storyId: string): StoryManifest | undefined {
  return PUBLISHED_STORIES_V1.find((manifest) => manifest.storyId === storyId);
}

export function storyWordCount(manifest: StoryManifest): number {
  return manifest.beats.reduce(
    (count, beat) => count + beat.text.trim().split(/\s+/u).filter(Boolean).length,
    0
  );
}
