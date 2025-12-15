import type {
  FactoryGraph,
  Place,
  Transition,
  SimulationEvent,
  ResourceType,
} from './types';
import { getRecipe } from '../../data/recipes';

/**
 * Check if a transition can fire (all inputs have required tokens,
 * all outputs have capacity).
 */
export function canFire(
  transition: Transition,
  places: Record<string, Place>
): boolean {
  // Check cooldown
  if (transition.cooldownRemaining > 0) {
    return false;
  }

  // Check all inputs have sufficient tokens
  for (const [placeId, required] of Object.entries(transition.inputs)) {
    const place = places[placeId];
    if (!place || place.tokens < required) {
      return false;
    }
  }

  // Check all outputs have capacity
  for (const [placeId, produced] of Object.entries(transition.outputs)) {
    const place = places[placeId];
    if (!place) {
      return false;
    }
    if (place.tokens + produced > place.capacity) {
      return false;
    }
  }

  return true;
}

/**
 * Fire a transition: consume inputs, produce outputs, set cooldown.
 * Returns the mutated graph and events.
 */
export function fireTransition(
  graph: FactoryGraph,
  transitionId: string
): { graph: FactoryGraph; events: SimulationEvent[] } {
  const transition = graph.transitions[transitionId];
  if (!transition) {
    return { graph, events: [] };
  }

  const events: SimulationEvent[] = [];
  const recipe = getRecipe(transition.recipeId);

  // Consume inputs
  for (const [placeId, amount] of Object.entries(transition.inputs)) {
    const place = graph.places[placeId];
    if (place) {
      place.tokens -= amount;
      events.push({
        type: 'tokens_moved',
        from: placeId,
        to: transitionId,
        amount,
        resource: place.resourceType,
      });
    }
  }

  // Produce outputs
  for (const [placeId, amount] of Object.entries(transition.outputs)) {
    const place = graph.places[placeId];
    if (place) {
      place.tokens += amount;
      events.push({
        type: 'tokens_moved',
        from: transitionId,
        to: placeId,
        amount,
        resource: place.resourceType,
      });
    }
  }

  // Set cooldown
  transition.cooldownRemaining = recipe?.duration ?? 1;

  events.push({
    type: 'transition_fired',
    transitionId,
    recipeId: transition.recipeId,
  });

  return { graph, events };
}

/**
 * Execute one tick of the simulation.
 * - Decrement cooldowns
 * - Fire all enabled transitions
 */
export function tick(graph: FactoryGraph): { graph: FactoryGraph; events: SimulationEvent[] } {
  const allEvents: SimulationEvent[] = [];

  // Decrement cooldowns
  for (const transition of Object.values(graph.transitions)) {
    if (transition.cooldownRemaining > 0) {
      transition.cooldownRemaining--;
    }
  }

  // Find and fire all enabled transitions
  // Note: We fire all that can fire in a single tick (parallel execution)
  const firingOrder = Object.keys(graph.transitions);

  for (const transitionId of firingOrder) {
    const transition = graph.transitions[transitionId];
    if (transition && canFire(transition, graph.places)) {
      const { events } = fireTransition(graph, transitionId);
      allEvents.push(...events);
    }
  }

  return { graph, events: allEvents };
}

/**
 * Create a new empty factory graph.
 */
export function createEmptyGraph(): FactoryGraph {
  return {
    places: {},
    transitions: {},
  };
}

/**
 * Add a place to the factory graph.
 */
export function addPlace(
  graph: FactoryGraph,
  place: Place
): FactoryGraph {
  return {
    ...graph,
    places: {
      ...graph.places,
      [place.id]: place,
    },
  };
}

/**
 * Add a transition to the factory graph.
 */
export function addTransition(
  graph: FactoryGraph,
  transition: Transition
): FactoryGraph {
  return {
    ...graph,
    transitions: {
      ...graph.transitions,
      [transition.id]: transition,
    },
  };
}

/**
 * Remove a place from the factory graph.
 * Also removes any transitions connected to it.
 */
export function removePlace(
  graph: FactoryGraph,
  placeId: string
): FactoryGraph {
  const { [placeId]: _, ...remainingPlaces } = graph.places;

  // Remove transitions that reference this place
  const remainingTransitions: Record<string, Transition> = {};
  for (const [tid, transition] of Object.entries(graph.transitions)) {
    const usesPlace =
      placeId in transition.inputs || placeId in transition.outputs;
    if (!usesPlace) {
      remainingTransitions[tid] = transition;
    }
  }

  return {
    places: remainingPlaces,
    transitions: remainingTransitions,
  };
}

/**
 * Remove a transition from the factory graph.
 */
export function removeTransition(
  graph: FactoryGraph,
  transitionId: string
): FactoryGraph {
  const { [transitionId]: _, ...remainingTransitions } = graph.transitions;
  return {
    ...graph,
    transitions: remainingTransitions,
  };
}

/**
 * Get total tokens of a resource type across all places.
 */
export function countResourceInFactory(
  graph: FactoryGraph,
  resourceType: ResourceType
): number {
  return Object.values(graph.places)
    .filter(p => p.resourceType === resourceType)
    .reduce((sum, p) => sum + p.tokens, 0);
}

/**
 * Generate a unique ID for nodes.
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
