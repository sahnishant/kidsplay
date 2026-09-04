import { resolveStoryLexicalProfile } from './storyLexicalReport';
import { validateStoryManifest, type StoryManifest } from './storiesContract';

const story = (value: StoryManifest): StoryManifest => {
  const manifest = validateStoryManifest(value);
  if (!resolveStoryLexicalProfile(manifest.lexicalProfileRef)) {
    throw new Error(`${manifest.storyId}: unknown story lexical profile ${manifest.lexicalProfileRef}`);
  }
  return manifest;
};

export const STORIES_V1: readonly StoryManifest[] = [
  story({
    schemaVersion: 1,
    storyId: 'story.dheu.moonlit-leaf',
    childTitle: 'The Moonlit Leaf',
    seriesId: 'stories.dheu-friends',
    lexicalProfileRef: 'lexical.story.preschool.simple',
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
  story({
    schemaVersion: 1,
    storyId: 'story.friends.quiet-backpack',
    childTitle: 'The Quiet Backpack',
    seriesId: 'stories.dheu-friends',
    lexicalProfileRef: 'lexical.story.preschool.simple',
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
  story({
    schemaVersion: 1,
    storyId: 'story.shaitanu.cape-trouble',
    childTitle: 'Shaitanu and the Wobbly Cape',
    seriesId: 'stories.shaitanu',
    lexicalProfileRef: 'lexical.story.early-reader.simple',
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
  story({
    schemaVersion: 1,
    storyId: 'story.scientu.tiny-question',
    childTitle: 'Scientu’s Tiny Question',
    seriesId: 'stories.scientu',
    lexicalProfileRef: 'lexical.story.early-reader.simple',
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

export function getStory(storyId: string): StoryManifest | undefined {
  return STORIES_V1.find((manifest) => manifest.storyId === storyId);
}

export function storyWordCount(manifest: StoryManifest): number {
  return manifest.beats.reduce((count, beat) => count + beat.text.trim().split(/\s+/u).filter(Boolean).length, 0);
}
