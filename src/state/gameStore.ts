import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FactoryGraph,
  Place,
  Transition,
  Order,
  ResourceType,
  SimulationEvent,
  SelectedNode,
} from '../engine/petri/types';
import {
  createEmptyGraph,
  addPlace,
  addTransition,
  removePlace,
  removeTransition,
  tick as simulateTick,
  generateId,
  countResourceInFactory,
} from '../engine/petri/simulation';
import { getRecipe } from '../data/recipes';
import { CHARACTERS } from '../data/characters';
import { RESOURCES } from '../data/resources';

// ============================================
// Store Interface
// ============================================

interface GameStore {
  // Factory State
  factory: FactoryGraph;

  // Economy
  currency: number;
  globalInventory: Record<ResourceType, number>;

  // Orders
  activeOrders: Order[];
  completedOrderCount: number;
  failedOrderCount: number;

  // Progression
  unlockedRecipes: string[];
  unlockedCharacters: string[];

  // Simulation
  tickCount: number;
  isPaused: boolean;
  tickSpeed: number;
  lastEvents: SimulationEvent[];

  // UI State
  selectedNode: SelectedNode;

  // Actions - Factory
  addPlaceToFactory: (resourceType: ResourceType, position: { x: number; y: number }) => string;
  addTransitionToFactory: (recipeId: string, position: { x: number; y: number }) => string;
  removePlaceFromFactory: (placeId: string) => void;
  removeTransitionFromFactory: (transitionId: string) => void;
  connectPlaceToTransition: (placeId: string, transitionId: string, asInput: boolean) => void;
  disconnectPlaceFromTransition: (placeId: string, transitionId: string) => void;
  updatePlaceTokens: (placeId: string, tokens: number) => void;
  moveNodePosition: (node: SelectedNode, position: { x: number; y: number }) => void;
  getNextNodePosition: () => { x: number; y: number };

  // Actions - Simulation
  runTick: () => void;
  togglePause: () => void;
  setTickSpeed: (speed: number) => void;

  // Actions - Orders
  generateOrder: () => void;
  completeOrder: (orderId: string) => void;
  failOrder: (orderId: string) => void;
  checkOrderCompletion: () => void;

  // Actions - Economy
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  addToInventory: (resource: ResourceType, amount: number) => void;
  transferToFactory: (resource: ResourceType, placeId: string, amount: number) => boolean;

  // Actions - Progression
  unlockRecipe: (recipeId: string) => boolean;

  // Actions - UI
  selectNode: (node: SelectedNode) => void;

  // Actions - Persistence
  resetGame: () => void;
}

// ============================================
// Initial State
// ============================================

const createInitialState = () => ({
  factory: createEmptyGraph(),
  currency: 100,
  globalInventory: {
    'tea-leaves': 10,
    'coffee-beans': 10,
    'milk': 5,
    'sugar': 10,
    'ice': 5,
    'honey': 3,
  } as Record<ResourceType, number>,
  activeOrders: [],
  completedOrderCount: 0,
  failedOrderCount: 0,
  unlockedRecipes: ['brew-green-tea', 'brew-espresso', 'make-sweet-tea'],
  unlockedCharacters: ['fern', 'bramble', 'dewdrop', 'moss'],
  tickCount: 0,
  isPaused: true,
  tickSpeed: 1000,
  lastEvents: [],
  selectedNode: null as SelectedNode,
});

// ============================================
// Store Implementation
// ============================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // Factory Actions
      addPlaceToFactory: (resourceType, position) => {
        const id = generateId('place');
        const resource = RESOURCES[resourceType];
        const place: Place = {
          id,
          resourceType,
          tokens: 0,
          capacity: 10,
          position,
          label: resource?.name ?? resourceType,
        };
        set(state => ({
          factory: addPlace(state.factory, place),
        }));
        return id;
      },

      addTransitionToFactory: (recipeId, position) => {
        const id = generateId('trans');
        const transition: Transition = {
          id,
          recipeId,
          inputs: {},
          outputs: {},
          cooldownRemaining: 0,
          position,
        };
        set(state => ({
          factory: addTransition(state.factory, transition),
        }));
        return id;
      },

      removePlaceFromFactory: (placeId) => {
        set(state => ({
          factory: removePlace(state.factory, placeId),
          selectedNode: state.selectedNode?.type === 'place' && state.selectedNode.id === placeId
            ? null
            : state.selectedNode,
        }));
      },

      removeTransitionFromFactory: (transitionId) => {
        set(state => ({
          factory: removeTransition(state.factory, transitionId),
          selectedNode: state.selectedNode?.type === 'transition' && state.selectedNode.id === transitionId
            ? null
            : state.selectedNode,
        }));
      },

      connectPlaceToTransition: (placeId, transitionId, asInput) => {
        set(state => {
          const place = state.factory.places[placeId];
          const transition = state.factory.transitions[transitionId];
          if (!place || !transition) return state;

          const recipe = getRecipe(transition.recipeId);
          if (!recipe) return state;

          const newTransition = { ...transition };
          if (asInput) {
            // Find matching input requirement
            const inputReq = recipe.inputs.find(i => i.resource === place.resourceType);
            if (inputReq) {
              newTransition.inputs = {
                ...transition.inputs,
                [placeId]: inputReq.amount,
              };
            }
          } else {
            // Find matching output
            const outputReq = recipe.outputs.find(o => o.resource === place.resourceType);
            if (outputReq) {
              newTransition.outputs = {
                ...transition.outputs,
                [placeId]: outputReq.amount,
              };
            }
          }

          return {
            factory: {
              ...state.factory,
              transitions: {
                ...state.factory.transitions,
                [transitionId]: newTransition,
              },
            },
          };
        });
      },

      disconnectPlaceFromTransition: (placeId, transitionId) => {
        set(state => {
          const transition = state.factory.transitions[transitionId];
          if (!transition) return state;

          const { [placeId]: _in, ...remainingInputs } = transition.inputs;
          const { [placeId]: _out, ...remainingOutputs } = transition.outputs;

          return {
            factory: {
              ...state.factory,
              transitions: {
                ...state.factory.transitions,
                [transitionId]: {
                  ...transition,
                  inputs: remainingInputs,
                  outputs: remainingOutputs,
                },
              },
            },
          };
        });
      },

      updatePlaceTokens: (placeId, tokens) => {
        set(state => {
          const place = state.factory.places[placeId];
          if (!place) return state;

          return {
            factory: {
              ...state.factory,
              places: {
                ...state.factory.places,
                [placeId]: {
                  ...place,
                  tokens: Math.max(0, Math.min(tokens, place.capacity)),
                },
              },
            },
          };
        });
      },

      moveNodePosition: (node, position) => {
        if (!node) return;

        set(state => {
          if (node.type === 'place') {
            const place = state.factory.places[node.id];
            if (!place) return state;
            return {
              factory: {
                ...state.factory,
                places: {
                  ...state.factory.places,
                  [node.id]: { ...place, position },
                },
              },
            };
          } else {
            const transition = state.factory.transitions[node.id];
            if (!transition) return state;
            return {
              factory: {
                ...state.factory,
                transitions: {
                  ...state.factory.transitions,
                  [node.id]: { ...transition, position },
                },
              },
            };
          }
        });
      },

      getNextNodePosition: () => {
        const state = get();
        const places = Object.values(state.factory.places);
        const transitions = Object.values(state.factory.transitions);
        const allNodes = [...places, ...transitions];

        // Grid-based placement: find next empty grid slot
        const gridSize = 50;
        const occupied = new Set(
          allNodes.map(n => `${Math.round(n.position.x / gridSize)},${Math.round(n.position.y / gridSize)}`)
        );

        // Start from (2,2) and spiral outward
        const startX = 2;
        const startY = 2;
        let x = startX;
        let y = startY;
        let dx = 1;
        let dy = 0;
        let stepsInDirection = 1;
        let stepsTaken = 0;
        let directionChanges = 0;

        for (let i = 0; i < 200; i++) {
          const key = `${x},${y}`;
          if (!occupied.has(key)) {
            return { x: x * gridSize, y: y * gridSize };
          }

          x += dx;
          y += dy;
          stepsTaken++;

          if (stepsTaken >= stepsInDirection) {
            stepsTaken = 0;
            // Rotate direction: right -> down -> left -> up
            const temp = dx;
            dx = -dy;
            dy = temp;
            directionChanges++;
            if (directionChanges % 2 === 0) {
              stepsInDirection++;
            }
          }
        }

        // Fallback
        return { x: 100, y: 100 };
      },

      // Simulation Actions
      runTick: () => {
        set(state => {
          const { graph, events } = simulateTick(state.factory);

          // Decrement order time limits
          const updatedOrders = state.activeOrders.map(order => ({
            ...order,
            timeLimit: order.timeLimit - 1,
          }));

          // Check for expired orders
          const expiredOrders = updatedOrders.filter(o => o.timeLimit <= 0);
          const activeOrders = updatedOrders.filter(o => o.timeLimit > 0);

          return {
            factory: graph,
            tickCount: state.tickCount + 1,
            lastEvents: events,
            activeOrders,
            failedOrderCount: state.failedOrderCount + expiredOrders.length,
          };
        });

        // Check order completion after tick
        get().checkOrderCompletion();
      },

      togglePause: () => {
        set(state => ({ isPaused: !state.isPaused }));
      },

      setTickSpeed: (speed) => {
        set({ tickSpeed: speed });
      },

      // Order Actions
      generateOrder: () => {
        const state = get();
        const availableCharacters = state.unlockedCharacters;
        if (availableCharacters.length === 0) return;

        const characterId = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        const character = CHARACTERS[characterId];
        if (!character) return;

        // Pick a random drink the character likes
        const drink = character.preferredDrinks[
          Math.floor(Math.random() * character.preferredDrinks.length)
        ];

        const order: Order = {
          id: generateId('order'),
          characterId,
          items: [{ resource: drink, amount: 1 }],
          timeLimit: Math.floor(60 * character.patience),
          reward: (RESOURCES[drink]?.baseValue ?? 5) * 3,
          createdAt: state.tickCount,
        };

        set(state => ({
          activeOrders: [...state.activeOrders, order],
        }));
      },

      completeOrder: (orderId) => {
        set(state => {
          const order = state.activeOrders.find(o => o.id === orderId);
          if (!order) return state;

          return {
            activeOrders: state.activeOrders.filter(o => o.id !== orderId),
            completedOrderCount: state.completedOrderCount + 1,
            currency: state.currency + order.reward,
          };
        });
      },

      failOrder: (orderId) => {
        set(state => ({
          activeOrders: state.activeOrders.filter(o => o.id !== orderId),
          failedOrderCount: state.failedOrderCount + 1,
        }));
      },

      checkOrderCompletion: () => {
        const state = get();

        for (const order of state.activeOrders) {
          let canComplete = true;

          for (const item of order.items) {
            const available = countResourceInFactory(state.factory, item.resource);
            if (available < item.amount) {
              canComplete = false;
              break;
            }
          }

          if (canComplete) {
            // Consume resources from factory
            for (const item of order.items) {
              let remaining = item.amount;
              for (const place of Object.values(state.factory.places)) {
                if (place.resourceType === item.resource && place.tokens > 0) {
                  const take = Math.min(place.tokens, remaining);
                  get().updatePlaceTokens(place.id, place.tokens - take);
                  remaining -= take;
                  if (remaining <= 0) break;
                }
              }
            }

            get().completeOrder(order.id);
          }
        }
      },

      // Economy Actions
      addCurrency: (amount) => {
        set(state => ({ currency: state.currency + amount }));
      },

      spendCurrency: (amount) => {
        const state = get();
        if (state.currency < amount) return false;
        set({ currency: state.currency - amount });
        return true;
      },

      addToInventory: (resource, amount) => {
        set(state => ({
          globalInventory: {
            ...state.globalInventory,
            [resource]: (state.globalInventory[resource] ?? 0) + amount,
          },
        }));
      },

      transferToFactory: (resource, placeId, amount) => {
        const state = get();
        const place = state.factory.places[placeId];
        if (!place || place.resourceType !== resource) return false;

        const available = state.globalInventory[resource] ?? 0;
        const spaceInPlace = place.capacity - place.tokens;
        const toTransfer = Math.min(amount, available, spaceInPlace);

        if (toTransfer <= 0) return false;

        set(state => ({
          globalInventory: {
            ...state.globalInventory,
            [resource]: (state.globalInventory[resource] ?? 0) - toTransfer,
          },
          factory: {
            ...state.factory,
            places: {
              ...state.factory.places,
              [placeId]: {
                ...place,
                tokens: place.tokens + toTransfer,
              },
            },
          },
        }));

        return true;
      },

      // Progression Actions
      unlockRecipe: (recipeId) => {
        const state = get();
        const recipe = getRecipe(recipeId);
        if (!recipe || state.unlockedRecipes.includes(recipeId)) return false;
        if (recipe.unlockCost && state.currency < recipe.unlockCost) return false;

        if (recipe.unlockCost) {
          set({ currency: state.currency - recipe.unlockCost });
        }

        set(state => ({
          unlockedRecipes: [...state.unlockedRecipes, recipeId],
        }));

        return true;
      },

      // UI Actions
      selectNode: (node) => {
        set({ selectedNode: node });
      },

      // Reset
      resetGame: () => {
        set(createInitialState());
      },
    }),
    {
      name: 'green-factory-save',
      partialize: (state) => ({
        factory: state.factory,
        currency: state.currency,
        globalInventory: state.globalInventory,
        activeOrders: state.activeOrders,
        completedOrderCount: state.completedOrderCount,
        failedOrderCount: state.failedOrderCount,
        unlockedRecipes: state.unlockedRecipes,
        unlockedCharacters: state.unlockedCharacters,
        tickCount: state.tickCount,
      }),
    }
  )
);
