import type { StoryManifest } from './storiesContract';

// HUMAN approval is audited in content/stories/v1-human-approval.json and
// source-pinned by production tests. Keep only the compact publication
// projection in the child runtime; any future story change requires new
// approval evidence and a matching reviewed change here.
const APPROVED_STORY_IDS = new Set([
  'story.dheu.moonlit-leaf',
  'story.friends.quiet-backpack',
  'story.shaitanu.cape-trouble',
  'story.scientu.tiny-question'
]);

export function isStoryV1HumanApproved(storyId: string): boolean {
  return APPROVED_STORY_IDS.has(storyId);
}

export function applyStoryV1HumanApproval(manifest: StoryManifest): StoryManifest {
  return isStoryV1HumanApproved(manifest.storyId)
    ? { ...manifest, editorialStatus: 'reviewed' }
    : manifest;
}
