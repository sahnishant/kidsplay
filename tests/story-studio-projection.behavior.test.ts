import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import stories from '../content/stories/studio-pilots.json';
import bindings from '../content/experience/story-studio-projections.json';
import { projectStoryStudio } from '../scripts/formatters/storyStudio.mjs';
import { validateStoryManifest } from '../src/experience/storiesContract';
import { evaluate } from '../src/evaluation/evaluate';
import type { SequenceOrderQuestion } from '../src/contracts/question';

const story = stories[0];
const binding = bindings[0];
function permutations<T>(items: T[]): T[][] { return items.length ? items.flatMap((item,i) => permutations(items.filter((_,j) => i !== j)).map((rest) => [item,...rest])) : [[]]; }

describe('story-local sequence projection', () => {
  it('reuses the existing non-assessing story contract', () => {
    expect(() => validateStoryManifest(story)).not.toThrow();
    expect(story.assessmentPolicy).toBe('none');
    expect(story.masteryWritesAllowed).toBe(false);
    expect(story.editorialStatus).toBe('draft');
  });
  it('derives all cards from original beats, never a shared factual row', () => {
    const before = structuredClone(story);
    const question = projectStoryStudio(story,binding) as SequenceOrderQuestion;
    expect(question.interaction.items.map((item) => item.label)).toEqual(story.beats.map((beat) => beat.text));
    expect(question.solution.orderedItemIds).toEqual(story.beats.map((beat) => beat.beatId));
    expect(question.knowledgeRefs).toEqual([]);
    expect(question.authoring.source).toBe(`story:${story.storyId}`);
    const results = permutations(question.solution.orderedItemIds).map((orderedItemIds) => evaluate(question,{orderedItemIds}));
    expect(results.filter((result) => result.correct)).toHaveLength(1);
    expect(results.every((result) => !result.masteryEvidence.length && !result.knowledgeEvidence.length)).toBe(true);
    expect(story).toEqual(before);
  });
  it('checks the exact compiled delivery against its source projection', () => {
    const output = JSON.parse(readFileSync(resolve(process.cwd(),'content/questions/__generated-story-studios.json'),'utf8'));
    expect(output).toEqual([projectStoryStudio(story,binding)]);
  });
  it.each(['solution','answers','orderedItemIds','knowledgeRefs'])('rejects %s embedded in projection references', (field) => {
    expect(() => projectStoryStudio(story,{...binding,[field]:[]})).toThrow();
  });
  it('rejects unrelated stories, duplicate or indistinguishable beats and assessment escalation', () => {
    expect(() => projectStoryStudio({...story,storyId:'another'},binding)).toThrow();
    expect(() => projectStoryStudio({...story,beats:[story.beats[0],story.beats[0]]},binding)).toThrow();
    expect(() => projectStoryStudio({...story,beats:[story.beats[0],{...story.beats[1],text:story.beats[0].text}]},binding)).toThrow();
    expect(() => projectStoryStudio({...story,masteryWritesAllowed:true},binding)).toThrow();
    expect(() => projectStoryStudio({...story,assessmentPolicy:'quiz'},binding)).toThrow();
  });
});
