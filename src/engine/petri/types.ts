// ============================================
// Core Petri Net Types for Green Factory
// ============================================

/** Unique identifier for resources (tea, sugar, latte, etc.) */
export type ResourceType = string;

/** Position on the factory canvas */
export interface Position {
  x: number;
  y: number;
}

// ============================================
// Petri Net Core Types
// ============================================

/**
 * A Place holds tokens of a specific resource type.
 * In factory terms: a storage node for ingredients or drinks.
 */
export interface Place {
  id: string;
  resourceType: ResourceType;
  tokens: number;        // Current count of resources
  capacity: number;      // Maximum storage capacity
  position: Position;
  label?: string;        // Display name
}

/**
 * A Transition transforms inputs into outputs.
 * In factory terms: a recipe station that consumes ingredients to produce drinks.
 */
export interface Transition {
  id: string;
  recipeId: string;
  inputs: Record<string, number>;   // placeId -> required token count
  outputs: Record<string, number>;  // placeId -> produced token count
  cooldownRemaining: number;        // Ticks until can fire again
  position: Position;
}

/**
 * The complete factory graph structure.
 */
export interface FactoryGraph {
  places: Record<string, Place>;
  transitions: Record<string, Transition>;
}

// ============================================
// Recipe System Types
// ============================================

/** Input requirement for a recipe */
export interface RecipeInput {
  resource: ResourceType;
  amount: number;
}

/** Output produced by a recipe */
export interface RecipeOutput {
  resource: ResourceType;
  amount: number;
}

/**
 * A Recipe defines how to transform resources.
 * Templates for creating Transitions in the factory.
 */
export interface Recipe {
  id: string;
  name: string;
  icon: string;          // Emoji representation
  description: string;
  inputs: RecipeInput[];
  outputs: RecipeOutput[];
  duration: number;      // Ticks to complete (cooldown after firing)
  unlocked: boolean;
  unlockCost?: number;   // Currency to unlock
}

// ============================================
// Resource Definition Types
// ============================================

/**
 * Defines a resource that can exist in the factory.
 */
export interface ResourceDefinition {
  id: ResourceType;
  name: string;
  icon: string;          // Emoji
  category: 'ingredient' | 'drink' | 'modifier';
  baseValue: number;     // Used for scoring/selling
  color: string;         // For UI theming
}

// ============================================
// Order & Character Types
// ============================================

/** A drink request within an order */
export interface OrderItem {
  resource: ResourceType;
  amount: number;
}

/**
 * An order from a customer character.
 */
export interface Order {
  id: string;
  characterId: string;
  items: OrderItem[];
  timeLimit: number;     // Ticks remaining before order expires
  reward: number;        // Currency earned on completion
  createdAt: number;     // Tick when order was created
}

/**
 * A character who visits the cafe.
 */
export interface Character {
  id: string;
  name: string;
  portrait: string;      // Emoji or avatar identifier
  flavorTexts: string[]; // Random quotes when ordering/receiving
  preferredDrinks: ResourceType[];
  patience: number;      // Base time limit modifier
}

// ============================================
// Game State Types
// ============================================

/**
 * Complete game state.
 */
export interface GameState {
  // Factory
  factory: FactoryGraph;

  // Resources & Economy
  globalInventory: Record<ResourceType, number>; // Resources not in factory
  currency: number;

  // Orders
  activeOrders: Order[];
  completedOrderCount: number;
  failedOrderCount: number;

  // Progression
  unlockedRecipes: Set<string>;
  unlockedCharacters: Set<string>;

  // Simulation
  tickCount: number;
  isPaused: boolean;
  tickSpeed: number;     // Milliseconds per tick
}

// ============================================
// Simulation Event Types
// ============================================

/** Events that occur during simulation */
export type SimulationEvent =
  | { type: 'transition_fired'; transitionId: string; recipeId: string }
  | { type: 'tokens_moved'; from: string; to: string; amount: number; resource: ResourceType }
  | { type: 'order_completed'; orderId: string; reward: number }
  | { type: 'order_expired'; orderId: string }
  | { type: 'character_arrived'; characterId: string; orderId: string };

// ============================================
// UI State Types
// ============================================

export type SelectedNode =
  | { type: 'place'; id: string }
  | { type: 'transition'; id: string }
  | null;

export interface UIState {
  selectedNode: SelectedNode;
  isPanelOpen: boolean;
  activePanel: 'orders' | 'recipes' | 'settings' | null;
  cameraOffset: Position;
  cameraZoom: number;
}
