import { readFileSync, writeFileSync } from 'node:fs';
import { projectStoryStudio } from './formatters/storyStudio.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const stories = read('content/stories/studio-pilots.json');
const bindings = read('content/experience/story-studio-projections.json');
if (!Array.isArray(stories) || !Array.isArray(bindings) || bindings.length > 32) throw new Error('Invalid bounded story studio inputs');
const byId = new Map();
for (const story of stories) {
  if (!story?.storyId || byId.has(story.storyId)) throw new Error('Duplicate or missing source story ID');
  byId.set(story.storyId, story);
}
const ids = new Set();
const questions = bindings.map((binding) => {
  if (ids.has(binding.questionId)) throw new Error('Duplicate story studio question ID');
  ids.add(binding.questionId);
  return projectStoryStudio(byId.get(binding.storyId), binding);
});
writeFileSync(new URL('content/questions/__generated-story-studios.json', root), `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
console.log(`Projected ${questions.length} story-local practice question(s); no shared knowledge claims or story assessment added.`);
