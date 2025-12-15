import { useGameStore } from '../../state/gameStore';
import { RESOURCES } from '../../data/resources';
import { getRecipe } from '../../data/recipes';

export function NodeConfigPanel() {
  const selectedNode = useGameStore(state => state.selectedNode);
  const factory = useGameStore(state => state.factory);
  const globalInventory = useGameStore(state => state.globalInventory);
  const selectNode = useGameStore(state => state.selectNode);
  const removePlaceFromFactory = useGameStore(state => state.removePlaceFromFactory);
  const removeTransitionFromFactory = useGameStore(state => state.removeTransitionFromFactory);
  const transferToFactory = useGameStore(state => state.transferToFactory);
  const connectPlaceToTransition = useGameStore(state => state.connectPlaceToTransition);

  if (!selectedNode) return null;

  if (selectedNode.type === 'place') {
    const place = factory.places[selectedNode.id];
    if (!place) return null;

    const resource = RESOURCES[place.resourceType];
    const inventoryCount = globalInventory[place.resourceType] ?? 0;

    // Find transitions that could connect to this place
    const possibleConnections = Object.values(factory.transitions).filter(t => {
      const recipe = getRecipe(t.recipeId);
      if (!recipe) return false;
      const needsAsInput = recipe.inputs.some(i => i.resource === place.resourceType);
      const needsAsOutput = recipe.outputs.some(o => o.resource === place.resourceType);
      return needsAsInput || needsAsOutput;
    });

    return (
      <div className="absolute bottom-16 left-0 right-0 bg-forest-700 border-t border-forest-600 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{resource?.icon ?? '?'}</span>
            <div>
              <h3 className="text-cream font-medium">{resource?.name ?? place.resourceType}</h3>
              <p className="text-xs text-cream/60">Storage Node</p>
            </div>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="text-cream/60 hover:text-cream"
          >
            X
          </button>
        </div>

        {/* Token info */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-cream/60">Stored:</span>
          <span className="text-sage-light">{place.tokens} / {place.capacity}</span>
        </div>

        {/* Transfer from inventory */}
        {inventoryCount > 0 && place.tokens < place.capacity && (
          <button
            onClick={() => transferToFactory(place.resourceType, place.id, 1)}
            className="w-full bg-sage/20 hover:bg-sage/30 text-sage-light py-2 rounded mb-2 text-sm"
          >
            Add from inventory ({inventoryCount} available)
          </button>
        )}

        {/* Possible connections */}
        {possibleConnections.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-cream/60 mb-1">Connect to:</p>
            <div className="flex flex-wrap gap-1">
              {possibleConnections.map(transition => {
                const recipe = getRecipe(transition.recipeId);
                const isInput = recipe?.inputs.some(i => i.resource === place.resourceType);
                const isConnectedAsInput = place.id in transition.inputs;
                const isConnectedAsOutput = place.id in transition.outputs;

                return (
                  <button
                    key={transition.id}
                    onClick={() => {
                      if (!isConnectedAsInput && !isConnectedAsOutput) {
                        connectPlaceToTransition(place.id, transition.id, isInput ?? false);
                      }
                    }}
                    disabled={isConnectedAsInput || isConnectedAsOutput}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      isConnectedAsInput || isConnectedAsOutput
                        ? 'bg-sage/30 text-sage'
                        : 'bg-forest-600 hover:bg-forest-500 text-cream/80'
                    }`}
                  >
                    {recipe?.icon}
                    {isConnectedAsInput && ' (in)'}
                    {isConnectedAsOutput && ' (out)'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={() => {
            removePlaceFromFactory(place.id);
            selectNode(null);
          }}
          className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 py-2 rounded text-sm"
        >
          Remove Node
        </button>
      </div>
    );
  }

  if (selectedNode.type === 'transition') {
    const transition = factory.transitions[selectedNode.id];
    if (!transition) return null;

    const recipe = getRecipe(transition.recipeId);

    return (
      <div className="absolute bottom-16 left-0 right-0 bg-forest-700 border-t border-forest-600 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{recipe?.icon ?? '?'}</span>
            <div>
              <h3 className="text-cream font-medium">{recipe?.name ?? transition.recipeId}</h3>
              <p className="text-xs text-cream/60">Recipe Station</p>
            </div>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="text-cream/60 hover:text-cream"
          >
            X
          </button>
        </div>

        {/* Connection status */}
        <div className="mb-3 text-sm">
          <p className="text-cream/60 mb-1">Inputs:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe?.inputs.map((input, idx) => {
              const connectedPlace = Object.entries(transition.inputs).find(
                ([pid]) => factory.places[pid]?.resourceType === input.resource
              );
              return (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded text-xs ${
                    connectedPlace ? 'bg-sage/30 text-sage' : 'bg-forest-600 text-cream/40'
                  }`}
                >
                  {RESOURCES[input.resource]?.icon ?? '?'} x{input.amount}
                  {connectedPlace ? ' connected' : ' needed'}
                </span>
              );
            })}
          </div>

          <p className="text-cream/60 mb-1">Outputs:</p>
          <div className="flex flex-wrap gap-1">
            {recipe?.outputs.map((output, idx) => {
              const connectedPlace = Object.entries(transition.outputs).find(
                ([pid]) => factory.places[pid]?.resourceType === output.resource
              );
              return (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded text-xs ${
                    connectedPlace ? 'bg-sage/30 text-sage' : 'bg-forest-600 text-cream/40'
                  }`}
                >
                  {RESOURCES[output.resource]?.icon ?? '?'} x{output.amount}
                  {connectedPlace ? ' connected' : ' needed'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Cooldown status */}
        {transition.cooldownRemaining > 0 && (
          <div className="mb-3 text-sm text-amber-warm">
            Processing... ({transition.cooldownRemaining} ticks remaining)
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={() => {
            removeTransitionFromFactory(transition.id);
            selectNode(null);
          }}
          className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 py-2 rounded text-sm"
        >
          Remove Station
        </button>
      </div>
    );
  }

  return null;
}
