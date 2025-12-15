import type { Character } from '../engine/petri/types';

export const CHARACTERS: Record<string, Character> = {
  fern: {
    id: 'fern',
    name: 'Fern',
    portrait: '🌿',
    flavorTexts: [
      "A cup of tea sounds lovely right now...",
      "The forest air always makes me thirsty!",
      "Thank you, this is perfect!",
      "You make the best tea in the grove!",
    ],
    preferredDrinks: ['green-tea', 'honey-tea', 'iced-tea'],
    patience: 1.0,
  },
  bramble: {
    id: 'bramble',
    name: 'Bramble',
    portrait: '🦔',
    flavorTexts: [
      "*yawn* Need. Coffee. Now.",
      "I haven't had my morning espresso yet...",
      "Ah, that hits the spot!",
      "Finally, I can think clearly!",
    ],
    preferredDrinks: ['espresso', 'latte'],
    patience: 0.7,
  },
  dewdrop: {
    id: 'dewdrop',
    name: 'Dewdrop',
    portrait: '🧚',
    flavorTexts: [
      "Something sweet, pretty please!",
      "I love anything with sugar~",
      "Yay! So sweet and delicious!",
      "This is like liquid happiness!",
    ],
    preferredDrinks: ['sweet-tea', 'honey-tea', 'latte'],
    patience: 1.2,
  },
  moss: {
    id: 'moss',
    name: 'Moss',
    portrait: '🐸',
    flavorTexts: [
      "I'll have something... unusual.",
      "Surprise me with your craft.",
      "Hmm, interesting choice. I approve.",
      "The ancient recipes are the best ones.",
    ],
    preferredDrinks: ['iced-tea', 'honey-tea', 'green-tea'],
    patience: 1.5,
  },
};

export const getCharacter = (id: string): Character | undefined => {
  return CHARACTERS[id];
};

export const getAllCharacters = (): Character[] => {
  return Object.values(CHARACTERS);
};

export const getRandomFlavorText = (characterId: string, type: 'order' | 'complete'): string => {
  const character = CHARACTERS[characterId];
  if (!character) return '';

  const texts = character.flavorTexts;
  // First half are ordering texts, second half are completion texts
  const mid = Math.floor(texts.length / 2);
  const pool = type === 'order' ? texts.slice(0, mid) : texts.slice(mid);

  return pool[Math.floor(Math.random() * pool.length)] || '';
};
