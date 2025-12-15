import { useGameStore } from '../../state/gameStore';
import { RESOURCES } from '../../data/resources';

interface InventoryPanelProps {
  onClose: () => void;
}

export function InventoryPanel({ onClose }: InventoryPanelProps) {
  const globalInventory = useGameStore(state => state.globalInventory);
  const factory = useGameStore(state => state.factory);
  const transferToFactory = useGameStore(state => state.transferToFactory);
  const phase = useGameStore(state => state.phase);

  // Get places grouped by resource type
  const placesByResource: Record<string, { id: string; tokens: number; capacity: number }[]> = {};
  for (const place of Object.values(factory.places)) {
    if (!placesByResource[place.resourceType]) {
      placesByResource[place.resourceType] = [];
    }
    placesByResource[place.resourceType].push({
      id: place.id,
      tokens: place.tokens,
      capacity: place.capacity,
    });
  }

  const inventoryItems = Object.entries(globalInventory).filter(([_, amount]) => amount > 0);

  const handleTransfer = (resourceType: string) => {
    const places = placesByResource[resourceType];
    if (!places || places.length === 0) return;

    // Transfer to first place with capacity
    for (const place of places) {
      if (place.tokens < place.capacity) {
        transferToFactory(resourceType, place.id, 1);
        break;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-forest-800 rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest-600">
          <h2 className="text-lg font-semibold text-cream">Inventory</h2>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-cream p-1"
          >
            Close
          </button>
        </div>

        {/* Inventory list */}
        <div className="flex-1 overflow-y-auto p-4">
          {inventoryItems.length === 0 ? (
            <p className="text-cream/60 text-center py-4">No ingredients in inventory</p>
          ) : (
            <div className="space-y-2">
              {inventoryItems.map(([resourceType, amount]) => {
                const resource = RESOURCES[resourceType];
                const places = placesByResource[resourceType] ?? [];
                const hasPlaceWithSpace = places.some(p => p.tokens < p.capacity);

                return (
                  <div
                    key={resourceType}
                    className="bg-forest-700 rounded-lg p-3 flex items-center gap-3"
                  >
                    <span className="text-2xl">{resource?.icon ?? '?'}</span>
                    <div className="flex-1">
                      <h4 className="text-cream font-medium">{resource?.name ?? resourceType}</h4>
                      <p className="text-xs text-cream/60">
                        {amount} available
                        {places.length > 0 && (
                          <> · {places.reduce((sum, p) => sum + p.tokens, 0)} in factory</>
                        )}
                      </p>
                    </div>
                    {places.length > 0 && hasPlaceWithSpace && (
                      <button
                        onClick={() => handleTransfer(resourceType)}
                        disabled={phase !== 'running' && phase !== 'design'}
                        className="px-3 py-1.5 bg-sage/20 hover:bg-sage/30 text-sage-light rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    )}
                    {places.length === 0 && (
                      <span className="text-xs text-cream/40">No storage node</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Help text */}
          <p className="mt-4 text-xs text-cream/40 text-center">
            Build storage nodes for ingredients, then add from inventory.
            {phase === 'running' && ' Keep your factory fed during the run!'}
          </p>
        </div>
      </div>
    </div>
  );
}
