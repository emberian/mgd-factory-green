import type { Recipe } from '../engine/petri/types';

export const RECIPES: Record<string, Recipe> = {
  'brew-green-tea': {
    id: 'brew-green-tea',
    name: 'Brew Green Tea',
    icon: '🍃',
    description: 'Steep tea leaves into refreshing green tea',
    inputs: [{ resource: 'tea-leaves', amount: 1 }],
    outputs: [{ resource: 'green-tea', amount: 1 }],
    duration: 3,
    unlocked: true,
  },
  'brew-espresso': {
    id: 'brew-espresso',
    name: 'Brew Espresso',
    icon: '☕',
    description: 'Extract rich espresso from coffee beans',
    inputs: [{ resource: 'coffee-beans', amount: 1 }],
    outputs: [{ resource: 'espresso', amount: 1 }],
    duration: 2,
    unlocked: true,
  },
  'make-sweet-tea': {
    id: 'make-sweet-tea',
    name: 'Make Sweet Tea',
    icon: '🧋',
    description: 'Add sugar to green tea for a sweet treat',
    inputs: [
      { resource: 'green-tea', amount: 1 },
      { resource: 'sugar', amount: 1 },
    ],
    outputs: [{ resource: 'sweet-tea', amount: 1 }],
    duration: 2,
    unlocked: true,
  },
  'make-latte': {
    id: 'make-latte',
    name: 'Make Latte',
    icon: '🥤',
    description: 'Combine espresso with steamed milk',
    inputs: [
      { resource: 'espresso', amount: 1 },
      { resource: 'milk', amount: 1 },
    ],
    outputs: [{ resource: 'latte', amount: 1 }],
    duration: 3,
    unlocked: false,
    unlockCost: 50,
  },
  'make-iced-tea': {
    id: 'make-iced-tea',
    name: 'Make Iced Tea',
    icon: '🧊',
    description: 'Chill green tea over ice',
    inputs: [
      { resource: 'green-tea', amount: 1 },
      { resource: 'ice', amount: 1 },
    ],
    outputs: [{ resource: 'iced-tea', amount: 1 }],
    duration: 2,
    unlocked: false,
    unlockCost: 30,
  },
  'make-honey-tea': {
    id: 'make-honey-tea',
    name: 'Make Honey Tea',
    icon: '🍵',
    description: 'Sweeten green tea with golden honey',
    inputs: [
      { resource: 'green-tea', amount: 1 },
      { resource: 'honey', amount: 1 },
    ],
    outputs: [{ resource: 'honey-tea', amount: 1 }],
    duration: 2,
    unlocked: false,
    unlockCost: 75,
  },
};

export const getRecipe = (id: string): Recipe | undefined => {
  return RECIPES[id];
};

export const getUnlockedRecipes = (unlockedIds: Set<string>): Recipe[] => {
  return Object.values(RECIPES).filter(
    r => r.unlocked || unlockedIds.has(r.id)
  );
};

export const getLockedRecipes = (unlockedIds: Set<string>): Recipe[] => {
  return Object.values(RECIPES).filter(
    r => !r.unlocked && !unlockedIds.has(r.id)
  );
};
