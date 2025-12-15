import type {
  FactoryGraph,
  Place,
  Transition,
  SimulationEvent,
  ResourceType,
} from './types';
import { getRecipe } from '../../data/recipes';

/**
 * Check if a transition can start processing (is idle, has inputs, outputs have space).
 */
export function canStartProcessing(
  transition: Transition,
  places: Record<string, Place>
): boolean {
  // Must be idle (not currently processing)
  if (transition.processingRemaining > 0) {
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
 * Start processing: consume inputs and begin countdown.
 */
export function startProcessing(
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

  // Start processing countdown
  transition.processingRemaining = recipe?.duration ?? 1;

  return { graph, events };
}

/**
 * Complete processing: produce outputs.
 */
export function completeProcessing(
  graph: FactoryGraph,
  transitionId: string
): { graph: FactoryGraph; events: SimulationEvent[] } {
  const transition = graph.transitions[transitionId];
  if (!transition) {
    return { graph, events: [] };
  }

  const events: SimulationEvent[] = [];

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

  events.push({
    type: 'transition_fired',
    transitionId,
    recipeId: transition.recipeId,
  });

  return { graph, events };
}

/**
 * Execute one tick of the simulation.
 *
 * Processing model:
 * 1. Decrement processing counters
 * 2. Complete any transitions that finished processing (produce outputs)
 * 3. Start processing on idle transitions that have inputs ready
 */
export function tick(graph: FactoryGraph): { graph: FactoryGraph; events: SimulationEvent[] } {
  const allEvents: SimulationEvent[] = [];

  // Step 1 & 2: Decrement counters and complete finished transitions
  for (const transition of Object.values(graph.transitions)) {
    if (transition.processingRemaining > 0) {
      transition.processingRemaining--;

      // If just finished, produce outputs
      if (transition.processingRemaining === 0) {
        const { events } = completeProcessing(graph, transition.id);
        allEvents.push(...events);
      }
    }
  }

  // Step 3: Start processing on idle transitions with available inputs
  for (const transition of Object.values(graph.transitions)) {
    if (canStartProcessing(transition, graph.places)) {
      const { events } = startProcessing(graph, transition.id);
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
 * Disconnects from transitions but doesn't delete them.
 */
export function removePlace(
  graph: FactoryGraph,
  placeId: string
): FactoryGraph {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [placeId]: _removed, ...remainingPlaces } = graph.places;

  // Disconnect from transitions (don't delete them)
  const updatedTransitions: Record<string, Transition> = {};
  for (const [tid, transition] of Object.entries(graph.transitions)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [placeId]: _in, ...remainingInputs } = transition.inputs;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [placeId]: _out, ...remainingOutputs } = transition.outputs;
    updatedTransitions[tid] = {
      ...transition,
      inputs: remainingInputs,
      outputs: remainingOutputs,
    };
  }

  return {
    places: remainingPlaces,
    transitions: updatedTransitions,
  };
}

/**
 * Remove a transition from the factory graph.
 */
export function removeTransition(
  graph: FactoryGraph,
  transitionId: string
): FactoryGraph {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [transitionId]: _removed, ...remainingTransitions } = graph.transitions;
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
