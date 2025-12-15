import type { Level } from '../engine/petri/types';

export const LEVELS: Level[] = [
  {
    id: 'level-1',
    name: 'First Brew',
    description: 'Fern wants a simple green tea. Build a tea brewing station!',
    orders: [
      { characterId: 'fern', items: [{ resource: 'green-tea', amount: 1 }], arrivalTick: 0 },
    ],
    startingIngredients: {
      'tea-leaves': 5,
    },
    targetScore: 9,
    availableRecipes: ['brew-green-tea'],
  },
  {
    id: 'level-2',
    name: 'Morning Rush',
    description: 'Bramble needs coffee! Set up an espresso station.',
    orders: [
      { characterId: 'bramble', items: [{ resource: 'espresso', amount: 1 }], arrivalTick: 0 },
      { characterId: 'fern', items: [{ resource: 'green-tea', amount: 1 }], arrivalTick: 5 },
    ],
    startingIngredients: {
      'tea-leaves': 5,
      'coffee-beans': 5,
    },
    targetScore: 18,
    availableRecipes: ['brew-green-tea', 'brew-espresso'],
  },
  {
    id: 'level-3',
    name: 'Sweet Tooth',
    description: 'Dewdrop craves sweet tea. Chain two recipes together!',
    orders: [
      { characterId: 'dewdrop', items: [{ resource: 'sweet-tea', amount: 1 }], arrivalTick: 0 },
      { characterId: 'fern', items: [{ resource: 'green-tea', amount: 1 }], arrivalTick: 10 },
    ],
    startingIngredients: {
      'tea-leaves': 8,
      'sugar': 5,
    },
    targetScore: 24,
    availableRecipes: ['brew-green-tea', 'make-sweet-tea'],
  },
  {
    id: 'level-4',
    name: 'Busy Cafe',
    description: 'Multiple customers with different orders. Plan your factory wisely!',
    orders: [
      { characterId: 'fern', items: [{ resource: 'green-tea', amount: 1 }], arrivalTick: 0 },
      { characterId: 'bramble', items: [{ resource: 'espresso', amount: 1 }], arrivalTick: 3 },
      { characterId: 'dewdrop', items: [{ resource: 'sweet-tea', amount: 1 }], arrivalTick: 8 },
      { characterId: 'fern', items: [{ resource: 'green-tea', amount: 1 }], arrivalTick: 15 },
    ],
    startingIngredients: {
      'tea-leaves': 10,
      'coffee-beans': 5,
      'sugar': 5,
    },
    targetScore: 36,
    availableRecipes: ['brew-green-tea', 'brew-espresso', 'make-sweet-tea'],
  },
  {
    id: 'level-5',
    name: 'The Mysterious Moss',
    description: 'Moss wants something cold. Unlock and use the iced tea recipe!',
    orders: [
      { characterId: 'moss', items: [{ resource: 'iced-tea', amount: 1 }], arrivalTick: 0 },
      { characterId: 'fern', items: [{ resource: 'green-tea', amount: 1 }], arrivalTick: 5 },
      { characterId: 'moss', items: [{ resource: 'iced-tea', amount: 1 }], arrivalTick: 12 },
    ],
    startingIngredients: {
      'tea-leaves': 10,
      'ice': 8,
    },
    targetScore: 39,
    availableRecipes: ['brew-green-tea', 'make-iced-tea'],
  },
];

export const getLevel = (id: string): Level | undefined => {
  return LEVELS.find(l => l.id === id);
};

export const getLevelByIndex = (index: number): Level | undefined => {
  return LEVELS[index];
};
