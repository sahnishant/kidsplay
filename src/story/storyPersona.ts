import charactersJson from '../../content/story/characters.json';
import type {
  StoryCharacter,
  StoryCharacterDocument,
  StoryCharacterId,
  StoryCharacterPersona
} from './storyTypes';

const characters = (charactersJson as StoryCharacterDocument).characters;
const characterById = new Map(characters.map((character) => [character.id, character]));

function clonePersona(persona: StoryCharacterPersona): StoryCharacterPersona {
  return {
    ...persona,
    traits: [...persona.traits],
    notices: [...persona.notices],
    speech: {
      ...persona.speech,
      signatures: [...persona.speech.signatures],
      avoids: [...persona.speech.avoids]
    },
    visual: {
      ...persona.visual,
      palette: { ...persona.visual.palette },
      signatureFeatures: [...persona.visual.signatureFeatures],
      supportedAngles: [...persona.visual.supportedAngles],
      supportedPoses: [...persona.visual.supportedPoses],
      supportedExpressions: [...persona.visual.supportedExpressions],
      supportedMotions: [...persona.visual.supportedMotions]
    },
    relationships: { ...persona.relationships }
  };
}

export function getStoryCharacterPersona(characterId: StoryCharacterId): StoryCharacterPersona {
  const character = characterById.get(characterId);
  if (!character) throw new Error(`Unknown story character ${characterId}`);
  return clonePersona(character.persona);
}

export function getStoryCharacterProfile(characterId: StoryCharacterId): StoryCharacter {
  const character = characterById.get(characterId);
  if (!character) throw new Error(`Unknown story character ${characterId}`);
  return {
    ...character,
    personalization: { ...character.personalization },
    persona: clonePersona(character.persona)
  };
}
