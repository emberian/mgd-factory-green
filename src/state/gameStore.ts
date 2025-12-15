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
  GamePhase,
  Level,
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
import { RESOURCES } from '../data/resources';
import { LEVELS, getLevelByIndex } from '../data/levels';
import { CHARACTERS } from '../data/characters';

// Base ticks an order stays active before failing (modified by character patience)
const BASE_ORDER_PATIENCE = 20;

// Helper to create orders with calculated deadlines
const createOrdersFromLevel = (level: Level): Order[] => {
  return level.orders.map((po, idx) => {
    const character = CHARACTERS[po.characterId];
    const patience = character?.patience ?? 1.0;
    const deadline = po.arrivalTick + Math.round(BASE_ORDER_PATIENCE * patience);

    return {
      id: `order_${idx}`,
      characterId: po.characterId,
      items: po.items,
      status: 'pending' as const,
      arrivalTick: po.arrivalTick,
      deadlineTick: deadline,
      reward: po.items.reduce((sum, item) => sum + (RESOURCES[item.resource]?.baseValue ?? 5) * 3, 0),
    };
  });
};

// ============================================
// Store Interface
// ============================================

interface GameStore {
  // Level & Phase
  currentLevelIndex: number;
  currentLevel: Level | null;
  phase: GamePhase;

  // Factory State
  factory: FactoryGraph;

  // Economy
  currency: number;
  globalInventory: Record<ResourceType, number>;

  // Orders
  orders: Order[];  // All orders for current level
  levelScore: number;

  // Progression
  unlockedLevels: number;  // Highest unlocked level index

  // Simulation
  tickCount: number;
  isPaused: boolean;
  tickSpeed: number;
  lastEvents: SimulationEvent[];

  // UI State
  selectedNode: SelectedNode;

  // Actions - Level
  loadLevel: (levelIndex: number) => void;
  startRun: () => void;
  resetLevel: () => void;
  completeLevel: () => void;

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
  checkOrderCompletion: () => void;

  // Actions - Economy
  transferToFactory: (resource: ResourceType, placeId: string, amount: number) => boolean;

  // Actions - UI
  selectNode: (node: SelectedNode) => void;

  // Actions - Persistence
  resetGame: () => void;
}

// ============================================
// Initial State
// ============================================

const createInitialState = () => {
  const firstLevel = LEVELS[0];
  return {
    currentLevelIndex: 0,
    currentLevel: firstLevel,
    phase: 'design' as GamePhase,
    factory: createEmptyGraph(),
    currency: 0,
    globalInventory: { ...firstLevel.startingIngredients },
    orders: createOrdersFromLevel(firstLevel),
    levelScore: 0,
    unlockedLevels: 0,
    tickCount: 0,
    isPaused: true,
    tickSpeed: 500,
    lastEvents: [],
    selectedNode: null as SelectedNode,
  };
};

// ============================================
// Store Implementation
// ============================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // Level Actions
      loadLevel: (levelIndex) => {
        const level = getLevelByIndex(levelIndex);
        if (!level) return;

        set({
          currentLevelIndex: levelIndex,
          currentLevel: level,
          phase: 'design',
          factory: createEmptyGraph(),
          globalInventory: { ...level.startingIngredients },
          orders: createOrdersFromLevel(level),
          levelScore: 0,
          tickCount: 0,
          isPaused: true,
          selectedNode: null,
        });
      },

      startRun: () => {
        set({
          phase: 'running',
          isPaused: false,
          tickCount: 0,
        });
      },

      resetLevel: () => {
        const state = get();
        if (state.currentLevel) {
          get().loadLevel(state.currentLevelIndex);
        }
      },

      completeLevel: () => {
        const state = get();
        const allCompleted = state.orders.every(o => o.status === 'completed');

        set({
          phase: 'complete',
          isPaused: true,
          unlockedLevels: allCompleted
            ? Math.max(state.unlockedLevels, state.currentLevelIndex + 1)
            : state.unlockedLevels,
        });
      },

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
          processingRemaining: 0,
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
            const inputReq = recipe.inputs.find(i => i.resource === place.resourceType);
            if (inputReq) {
              newTransition.inputs = {
                ...transition.inputs,
                [placeId]: inputReq.amount,
              };
            }
          } else {
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

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [placeId]: _in, ...remainingInputs } = transition.inputs;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        const gridSize = 50;
        const occupied = new Set(
          allNodes.map(n => `${Math.round(n.position.x / gridSize)},${Math.round(n.position.y / gridSize)}`)
        );

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
            const temp = dx;
            dx = -dy;
            dy = temp;
            directionChanges++;
            if (directionChanges % 2 === 0) {
              stepsInDirection++;
            }
          }
        }

        return { x: 100, y: 100 };
      },

      // Simulation Actions
      runTick: () => {
        const state = get();
        if (state.phase !== 'running') return;

        set(state => {
          const { graph, events } = simulateTick(state.factory);
          const newTickCount = state.tickCount + 1;

          // Update order statuses: activate arriving orders, fail expired orders
          const updatedOrders = state.orders.map(order => {
            // Activate orders that should arrive this tick
            if (order.status === 'pending' && order.arrivalTick <= state.tickCount) {
              return { ...order, status: 'active' as const };
            }
            // Fail orders that have expired
            if (order.status === 'active' && newTickCount >= order.deadlineTick) {
              return { ...order, status: 'failed' as const };
            }
            return order;
          });

          return {
            factory: graph,
            tickCount: newTickCount,
            lastEvents: events,
            orders: updatedOrders,
          };
        });

        // Check order completion after tick
        get().checkOrderCompletion();

        // Check if level is complete (all orders resolved)
        const newState = get();
        const allResolved = newState.orders.every(o => o.status === 'completed' || o.status === 'failed');
        if (allResolved) {
          get().completeLevel();
        }
      },

      togglePause: () => {
        const state = get();
        if (state.phase === 'design') {
          // Start run when unpausing from design
          get().startRun();
        } else if (state.phase === 'running') {
          set(state => ({ isPaused: !state.isPaused }));
        }
      },

      setTickSpeed: (speed) => {
        set({ tickSpeed: speed });
      },

      // Order Actions
      checkOrderCompletion: () => {
        const state = get();

        for (const order of state.orders) {
          if (order.status !== 'active') continue;

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

            // Mark order completed
            set(state => ({
              orders: state.orders.map(o =>
                o.id === order.id ? { ...o, status: 'completed' as const } : o
              ),
              levelScore: state.levelScore + order.reward,
              currency: state.currency + order.reward,
            }));
          }
        }
      },

      // Economy Actions
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
        currency: state.currency,
        unlockedLevels: state.unlockedLevels,
        currentLevelIndex: state.currentLevelIndex,
      }),
    }
  )
);
