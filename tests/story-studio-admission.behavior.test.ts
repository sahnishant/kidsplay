import { describe, expect, it } from 'vitest';
import stories from '../content/stories/studio-pilots.json';
import bindings from '../content/experience/story-studio-projections.json';
import { projectStoryStudio } from '../scripts/formatters/storyStudio.mjs';
import { createStudioWorkspace, readStudioWorkspace } from '../src/experience/studioWorkspace.mjs';
import type { SequenceOrderQuestion } from '../src/contracts/question';

const source = stories[0];
const binding = bindings[0];
const id = 'studio.fire-station.visit-story';
describe('story adaptation admission and saved-work boundaries',() => {
  it.each(['questions','answers','score','mastery'])('refuses nested %s in a non-assessing story', (key) => {
    expect(() => projectStoryStudio({...source,beats:[{...source.beats[0],[key]:[]},...source.beats.slice(1)]},binding)).toThrow(/assessment field/);
  });
  it('rejects incomplete and overlong story inputs instead of truncating the source',() => {
    expect(() => projectStoryStudio({...source,beats:new Array(3)},binding)).toThrow();
    expect(() => projectStoryStudio({...source,beats:[source.beats[0]]},binding)).toThrow();
    expect(() => projectStoryStudio({...source,beats:[{...source.beats[0],text:'x'.repeat(181)},...source.beats.slice(1)]},binding)).toThrow();
  });
  it('refuses old work after a source-text change even if an author forgets the revision bump',() => {
    const original = projectStoryStudio(source,binding) as SequenceOrderQuestion;
    const saved = createStudioWorkspace(id,original,{orderedItemIds:[...original.solution.orderedItemIds].reverse()});
    const changed = {...source,beats:source.beats.map((beat,i) => i === 0 ? {...beat,text:'Dheu arrives with her grown-up for a different visit.'} : beat)};
    const revised = projectStoryStudio(changed,binding) as SequenceOrderQuestion;
    expect(revised.id).toBe(original.id);
    expect(revised.revision).toBe(original.revision);
    expect(readStudioWorkspace(id,revised,saved)).toBeNull();
    expect(readStudioWorkspace(id,original,saved)).not.toBeNull();
  });
  it('does not inherit adaptation review from a reviewed story',() => {
    const question = projectStoryStudio({...source,editorialStatus:'reviewed'},binding);
    expect(question.authoring.status).toBe('draft');
    expect(question.evidencePolicy).toBe('practice_only');
    expect(question.knowledgeRefs).toEqual([]);
  });
});
