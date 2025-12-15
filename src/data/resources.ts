import type { ResourceDefinition } from '../engine/petri/types';

export const RESOURCES: Record<string, ResourceDefinition> = {
  // Base Ingredients
  'tea-leaves': {
    id: 'tea-leaves',
    name: 'Tea Leaves',
    icon: '🍵',
    category: 'ingredient',
    baseValue: 1,
    color: '#4a7c4a',
  },
  'coffee-beans': {
    id: 'coffee-beans',
    name: 'Coffee Beans',
    icon: '☕',
    category: 'ingredient',
    baseValue: 1,
    color: '#6b4423',
  },
  'milk': {
    id: 'milk',
    name: 'Milk',
    icon: '🥛',
    category: 'ingredient',
    baseValue: 1,
    color: '#f5f5dc',
  },
  'sugar': {
    id: 'sugar',
    name: 'Sugar',
    icon: '🍬',
    category: 'modifier',
    baseValue: 1,
    color: '#ffffff',
  },
  'ice': {
    id: 'ice',
    name: 'Ice',
    icon: '🧊',
    category: 'modifier',
    baseValue: 1,
    color: '#add8e6',
  },
  'honey': {
    id: 'honey',
    name: 'Honey',
    icon: '🍯',
    category: 'modifier',
    baseValue: 2,
    color: '#daa520',
  },

  // Drinks
  'green-tea': {
    id: 'green-tea',
    name: 'Green Tea',
    icon: '🍃',
    category: 'drink',
    baseValue: 3,
    color: '#90ee90',
  },
  'espresso': {
    id: 'espresso',
    name: 'Espresso',
    icon: '☕',
    category: 'drink',
    baseValue: 3,
    color: '#3c1414',
  },
  'sweet-tea': {
    id: 'sweet-tea',
    name: 'Sweet Tea',
    icon: '🧋',
    category: 'drink',
    baseValue: 5,
    color: '#deb887',
  },
  'latte': {
    id: 'latte',
    name: 'Latte',
    icon: '🥤',
    category: 'drink',
    baseValue: 5,
    color: '#d2b48c',
  },
  'iced-tea': {
    id: 'iced-tea',
    name: 'Iced Tea',
    icon: '🧊',
    category: 'drink',
    baseValue: 5,
    color: '#87ceeb',
  },
  'honey-tea': {
    id: 'honey-tea',
    name: 'Honey Tea',
    icon: '🍵',
    category: 'drink',
    baseValue: 6,
    color: '#ffd700',
  },
};

export const getResource = (id: string): ResourceDefinition | undefined => {
  return RESOURCES[id];
};

export const getResourcesByCategory = (category: ResourceDefinition['category']): ResourceDefinition[] => {
  return Object.values(RESOURCES).filter(r => r.category === category);
};
