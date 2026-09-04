import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import missionsJson from '../content/story/missions.json';
import StoryCharacter from '../src/presentation/StoryCharacter.svelte';
import { getStoryCharacterPersona } from '../src/story/storyPersona';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';
import StoryWorld from '../src/ui/StoryWorldViewport.svelte';

function emptyStoryProgress(): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: {},
    completedLocations: {},
    completedSessionIds: [],
    updatedAt: null
  };
}

const requiredAngles = [
  'front',
  'three-quarter-left',
  'three-quarter-right',
  'side-left',
  'side-right'
] as const;

const sharedExpressions = [
  'neutral',
  'curious',
  'confused',
  'excited',
  'happy-laugh',
  'helping',
  'proud',
  'worried',
  'surprised'
] as const;

afterEach(() => cleanup());

describe('Character Persona System V1', () => {
  it('gives all three characters durable personality, visual breadth and motion vocabulary', () => {
    for (const character of ['dheu', 'scientu', 'shaitanu'] as const) {
      const persona = getStoryCharacterPersona(character);
      expect(persona.tagline.length).toBeGreaterThan(12);
      expect(persona.traits.length).toBeGreaterThanOrEqual(4);
      expect(persona.notices.length).toBeGreaterThanOrEqual(3);
      expect(persona.speech.signatures.length).toBeGreaterThanOrEqual(3);
      expect(persona.speech.avoids.length).toBeGreaterThanOrEqual(3);
      expect(persona.visual.signatureFeatures.length).toBeGreaterThanOrEqual(4);
      expect(persona.visual.supportedAngles).toEqual(expect.arrayContaining(requiredAngles));
      expect(persona.visual.supportedExpressions).toEqual(expect.arrayContaining(sharedExpressions));
      expect(persona.visual.supportedMotions.length).toBeGreaterThanOrEqual(10);
      expect(persona.visual.supportedAngles).toContain(persona.visual.defaultAngle);
      expect(persona.visual.supportedPoses).toContain(persona.visual.defaultPose);
      expect(persona.visual.supportedExpressions).toContain(persona.visual.defaultExpression);
      expect(persona.visual.supportedMotions).toContain(persona.visual.defaultMotion);
    }

    const shaitanu = getStoryCharacterPersona('shaitanu');
    expect(shaitanu.traits).toContain('secretly-helpful');
    expect(shaitanu.speech.avoids).toContain('always being wrong');
  });

  it('returns defensive persona copies so presentation cannot mutate canonical character identity', () => {
    const first = getStoryCharacterPersona('dheu');
    first.traits.push('mutated-at-runtime');
    first.visual.supportedMotions.length = 0;

    const second = getStoryCharacterPersona('dheu');
    expect(second.traits).not.toContain('mutated-at-runtime');
    expect(second.visual.supportedMotions.length).toBeGreaterThan(0);
  });

  it('renders Dheu as a dedicated explorer character rather than the generic child avatar', () => {
    const { container } = render(StoryCharacter, {
      props: {
        character: 'dheu',
        expression: 'wonder',
        pose: 'inspect',
        angle: 'three-quarter-right',
        motion: 'head-tilt',
        label: 'Dheu exploring'
      }
    });

    const actor = container.querySelector('[data-character="dheu"]');
    expect(actor?.getAttribute('data-expression')).toBe('wonder');
    expect(actor?.getAttribute('data-pose')).toBe('inspect');
    expect(actor?.getAttribute('data-angle')).toBe('three-quarter-right');
    expect(actor?.getAttribute('data-motion')).toBe('head-tilt');
    expect(container.querySelector('.dheu-backpack')).toBeTruthy();
    expect(container.querySelector('.dheu-leaf')).toBeTruthy();
    expect(container.querySelector('.kid-avatar')).toBeNull();
  });

  it('keeps Scientu and Shaitanu visually identifiable across side views and signature expressions', () => {
    const scientu = render(StoryCharacter, {
      props: {
        character: 'scientu',
        expression: 'aha',
        pose: 'inspect',
        angle: 'side-left',
        motion: 'bounce'
      }
    });
    expect(scientu.container.querySelector('.scientu-goggle')).toBeTruthy();
    expect(scientu.container.querySelector('[data-angle="side-left"]')).toBeTruthy();
    scientu.unmount();

    const shaitanu = render(StoryCharacter, {
      props: {
        character: 'shaitanu',
        expression: 'wicked-laugh',
        pose: 'proud',
        angle: 'three-quarter-left',
        motion: 'chuckle'
      }
    });
    expect(shaitanu.container.querySelector('.shaitanu-cape')).toBeTruthy();
    expect(shaitanu.container.querySelector('.shaitanu-orange-streak')).toBeTruthy();
    expect(shaitanu.container.querySelector('[data-expression="wicked-laugh"]')).toBeTruthy();
  });

  it('makes the mission-stage persona follow the actual authored speaker instead of hard-coding Shaitanu', async () => {
    render(StoryWorld, {
      props: {
        childName: 'Mira',
        childAvatar: 'fox',
        storyProgress: emptyStoryProgress(),
        recommendedTopics: [],
        topicProgress: [],
        onStartMission: vi.fn(),
        onExploreLocation: vi.fn()
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Continue Adventure' }));
    const persona = () => document.querySelector('.mission-persona');

    expect(persona()?.getAttribute('data-speaker')).toBe('shaitanu');
    expect(persona()?.querySelector('[data-character="shaitanu"]')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Next story beat' }));
    expect(persona()?.getAttribute('data-speaker')).toBe('scientu');
    expect(persona()?.querySelector('[data-character="scientu"]')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Next story beat' }));
    expect(persona()?.getAttribute('data-speaker')).toBe('dheu');
    expect(persona()?.querySelector('[data-character="dheu"]')).toBeTruthy();
  });

  it('rewrites Forest Level 1 around character chemistry rather than curriculum-summary dialogue', () => {
    const forest = missionsJson.missions.find((mission) => mission.id === 'mission.forest-explorer-trail');
    expect(forest?.beats).toHaveLength(3);
    expect(forest?.beats.map((beat) => beat.speakerRef)).toEqual(['shaitanu', 'scientu', 'dheu']);
    expect(forest?.beats[0].text).toMatch(/Heh-heh|Rabbit looks confused/);
    expect(forest?.beats[1].text).toMatch(/not trust the signs|forest itself/);
    expect(forest?.beats[2].text).toMatch(/First Rabbit|Let’s go/);
    expect(forest?.successBeat.speakerRef).toBe('shaitanu');
    expect(forest?.successBeat.expression).toBe('admiring');
    expect(forest?.successBeat.text).toMatch(/Do not tell Scientu/);

    const script = [...(forest?.beats ?? []), forest?.successBeat]
      .filter(Boolean)
      .map((beat) => beat?.text ?? '')
      .join(' ');
    expect(script).not.toMatch(/guided, matched, observed|classify the clues|activity type|question card/i);
  });
});
