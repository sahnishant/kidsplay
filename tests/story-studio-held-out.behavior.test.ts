import { expect, it } from 'vitest';
import sources from '../content/stories/studio-pilots.json';
import bindings from '../content/experience/story-studio-projections.json';
import { projectStoryStudio } from '../scripts/formatters/storyStudio.mjs';
import { validateStoryManifest } from '../src/experience/storiesContract';
import { evaluate } from '../src/evaluation/evaluate';
import type { SequenceOrderQuestion } from '../src/contracts/question';

it('adapts an unrelated held-out story without a topic-specific branch or copied order',() => {
  // QA-only fixture; not an additional child-facing topic or published story.
  const story = {...sources[0],storyId:'story.qa.paper-boat',childTitle:'The paper boat',beats:[
    {beatId:'boat.paper',text:'Dheu chooses a sheet of paper.',characterIds:['dheu']},
    {beatId:'boat.fold',text:'She folds the paper into a little boat.',characterIds:['dheu']},
    {beatId:'boat.give',text:'She gives the paper boat to her friend.',characterIds:['dheu']}
  ]};
  expect(() => validateStoryManifest(story)).not.toThrow();
  const binding = {...bindings[0],storyId:story.storyId,questionId:'qa.paper-boat.sequence',seed:911};
  const question = projectStoryStudio(story,binding) as SequenceOrderQuestion;
  expect(question.interaction.items.map((item) => item.label)).toEqual(story.beats.map((beat) => beat.text));
  expect(question.prompt.text).toContain(story.childTitle);
  expect(question.prompt.text).not.toMatch(/fire|station|visit/i);
  expect(question.solution.orderedItemIds).toEqual(story.beats.map((beat) => beat.beatId));
  const result = evaluate(question,{orderedItemIds:question.solution.orderedItemIds});
  expect(result.correct).toBe(true);
  expect(result.masteryEvidence).toEqual([]);
  expect(result.knowledgeEvidence).toEqual([]);
});
