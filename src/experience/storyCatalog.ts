import { resolveStoryLexicalProfile } from './storyLexicalReport';
import { isStoryPublishable, validateStoryManifest, type StoryManifest } from './storiesContract';

const storyCandidate = (value: StoryManifest): StoryManifest => {
  const manifest = validateStoryManifest(value);
  if (!resolveStoryLexicalProfile(manifest.lexicalProfileRef)) {
    throw new Error(`${manifest.storyId}: unknown story lexical profile ${manifest.lexicalProfileRef}`);
  }
  return manifest;
};

/**
 * Authored candidate manuscripts. Drafts may be machine-tested but must not be
 * exposed by published-story selectors until explicit editorial review occurs.
 */
export const STORY_CANDIDATES_V1: readonly StoryManifest[] = [
  storyCandidate({
    schemaVersion: 1,
    storyId: 'story.dheu.moonlit-leaf',
    childTitle: 'The Moonlit Leaf',
    seriesId: 'stories.dheu-friends',
    editorialStatus: 'draft',
    lexicalProfileRef: 'lexical.story.frequency-band-1',
    durationBand: 'bedtime_story',
    supportedModes: ['read_to_me', 'read_together'],
    beats: [
      { beatId: 'moonlit-leaf.1', text: 'Dheu found a little leaf beside the path.', characterIds: ['dheu'] },
      { beatId: 'moonlit-leaf.2', text: 'She tucked it safely into her backpack and walked home slowly.', characterIds: ['dheu'] },
      { beatId: 'moonlit-leaf.3', text: 'At the window, Dheu placed the leaf beside her favourite pebble.', characterIds: ['dheu'] },
      { beatId: 'moonlit-leaf.4', text: 'Everything was quiet. Dheu smiled, closed her eyes, and rested.', characterIds: ['dheu'] }
    ],
    assessmentPolicy: 'none',
    masteryWritesAllowed: false
  }),
  storyCandidate({
    schemaVersion: 1,
    storyId: 'story.friends.quiet-backpack',
    childTitle: 'The Quiet Backpack',
    seriesId: 'stories.dheu-friends',
    editorialStatus: 'draft',
    lexicalProfileRef: 'lexical.story.frequency-band-1',
    durationBand: 'bedtime_story',
    supportedModes: ['read_to_me', 'read_together'],
    beats: [
      { beatId: 'quiet-backpack.1', text: 'Dheu, Scientu, and Shaitanu had finished a long day of exploring.', characterIds: ['dheu', 'scientu', 'shaitanu'] },
      { beatId: 'quiet-backpack.2', text: 'Scientu put away one tiny tool. Dheu folded the map.', characterIds: ['dheu', 'scientu'] },
      { beatId: 'quiet-backpack.3', text: 'Shaitanu tried to hide one sock in the backpack, then giggled and put it back.', characterIds: ['shaitanu'] },
      { beatId: 'quiet-backpack.4', text: 'The three friends whispered good night. Even the backpack seemed ready to sleep.', characterIds: ['dheu', 'scientu', 'shaitanu'] }
    ],
    assessmentPolicy: 'none',
    masteryWritesAllowed: false
  }),
  storyCandidate({
    schemaVersion: 1,
    storyId: 'story.shaitanu.cape-trouble',
    childTitle: 'Shaitanu and the Wobbly Cape',
    seriesId: 'stories.shaitanu',
    editorialStatus: 'draft',
    lexicalProfileRef: 'lexical.story.frequency-band-2',
    durationBand: 'tiny_tale',
    supportedModes: ['read_to_me', 'read_together', 'i_can_read'],
    beats: [
      { beatId: 'cape-trouble.1', text: 'Shaitanu swept into the room wearing his cape sideways.', characterIds: ['shaitanu'] },
      { beatId: 'cape-trouble.2', text: 'He tried a grand turn. The cape wrapped around his own elbow.', characterIds: ['shaitanu'] },
      { beatId: 'cape-trouble.3', text: 'Dheu laughed. Shaitanu bowed anyway and said, “Exactly as planned.”', characterIds: ['dheu', 'shaitanu'] }
    ],
    assessmentPolicy: 'none',
    masteryWritesAllowed: false
  }),
  storyCandidate({
    schemaVersion: 1,
    storyId: 'story.scientu.tiny-question',
    childTitle: 'Scientu’s Tiny Question',
    seriesId: 'stories.scientu',
    editorialStatus: 'draft',
    lexicalProfileRef: 'lexical.story.frequency-band-2',
    durationBand: 'tiny_tale',
    supportedModes: ['read_to_me', 'read_together', 'i_can_read'],
    beats: [
      { beatId: 'tiny-question.1', text: 'Scientu spotted a shiny button under the table.', characterIds: ['scientu'] },
      { beatId: 'tiny-question.2', text: '“Hmm,” he said. “Who might this belong to?”', characterIds: ['scientu'] },
      { beatId: 'tiny-question.3', text: 'Dheu and Scientu looked at coats, bags, and pockets without rushing.', characterIds: ['dheu', 'scientu'] },
      { beatId: 'tiny-question.4', text: 'Shaitanu pointed at his cape. One button was missing. Mystery solved, with a grin.', characterIds: ['dheu', 'scientu', 'shaitanu'] }
    ],
    assessmentPolicy: 'none',
    masteryWritesAllowed: false
  })
];

export const PUBLISHED_STORIES_V1: readonly StoryManifest[] = STORY_CANDIDATES_V1.filter(isStoryPublishable);

export function getStoryCandidate(storyId: string): StoryManifest | undefined {
  return STORY_CANDIDATES_V1.find((manifest) => manifest.storyId === storyId);
}

export function getPublishedStory(storyId: string): StoryManifest | undefined {
  return PUBLISHED_STORIES_V1.find((manifest) => manifest.storyId === storyId);
}

export function storyWordCount(manifest: StoryManifest): number {
  return manifest.beats.reduce((count, beat) => count + beat.text.trim().split(/\s+/u).filter(Boolean).length, 0);
}
