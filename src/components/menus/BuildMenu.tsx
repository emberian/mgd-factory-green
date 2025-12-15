import { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { RESOURCES, getResourcesByCategory } from '../../data/resources';
import { RECIPES } from '../../data/recipes';

interface BuildMenuProps {
  onClose: () => void;
}

type BuildTab = 'places' | 'transitions';

export function BuildMenu({ onClose }: BuildMenuProps) {
  const [activeTab, setActiveTab] = useState<BuildTab>('places');

  const unlockedRecipes = useGameStore(state => state.unlockedRecipes);
  const addPlaceToFactory = useGameStore(state => state.addPlaceToFactory);
  const addTransitionToFactory = useGameStore(state => state.addTransitionToFactory);

  const ingredients = getResourcesByCategory('ingredient');
  const modifiers = getResourcesByCategory('modifier');
  const drinks = getResourcesByCategory('drink');

  const availableRecipes = Object.values(RECIPES).filter(
    r => r.unlocked || unlockedRecipes.includes(r.id)
  );

  const handleAddPlace = (resourceType: string) => {
    // Add at center with slight random offset
    const x = 200 + Math.random() * 100 - 50;
    const y = 200 + Math.random() * 100 - 50;
    addPlaceToFactory(resourceType, { x, y });
    onClose();
  };

  const handleAddTransition = (recipeId: string) => {
    const x = 200 + Math.random() * 100 - 50;
    const y = 200 + Math.random() * 100 - 50;
    addTransitionToFactory(recipeId, { x, y });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-forest-800 rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest-600">
          <h2 className="text-lg font-semibold text-cream">Build</h2>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-cream p-1"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-forest-600">
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'places'
                ? 'text-sage-light border-b-2 border-sage'
                : 'text-cream/60'
            }`}
          >
            Storage Nodes
          </button>
          <button
            onClick={() => setActiveTab('transitions')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'transitions'
                ? 'text-sage-light border-b-2 border-sage'
                : 'text-cream/60'
            }`}
          >
            Recipe Stations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'places' && (
            <div className="space-y-4">
              {/* Ingredients */}
              <div>
                <h3 className="text-xs font-medium text-cream/60 uppercase mb-2">Ingredients</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ingredients.map(resource => (
                    <button
                      key={resource.id}
                      onClick={() => handleAddPlace(resource.id)}
                      className="bg-forest-700 hover:bg-forest-600 border border-forest-600 rounded-lg p-2 flex flex-col items-center gap-1"
                    >
                      <span className="text-2xl">{resource.icon}</span>
                      <span className="text-xs text-cream/80 truncate w-full text-center">{resource.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modifiers */}
              <div>
                <h3 className="text-xs font-medium text-cream/60 uppercase mb-2">Modifiers</h3>
                <div className="grid grid-cols-3 gap-2">
                  {modifiers.map(resource => (
                    <button
                      key={resource.id}
                      onClick={() => handleAddPlace(resource.id)}
                      className="bg-forest-700 hover:bg-forest-600 border border-forest-600 rounded-lg p-2 flex flex-col items-center gap-1"
                    >
                      <span className="text-2xl">{resource.icon}</span>
                      <span className="text-xs text-cream/80 truncate w-full text-center">{resource.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drinks (output storage) */}
              <div>
                <h3 className="text-xs font-medium text-cream/60 uppercase mb-2">Drinks (Output)</h3>
                <div className="grid grid-cols-3 gap-2">
                  {drinks.map(resource => (
                    <button
                      key={resource.id}
                      onClick={() => handleAddPlace(resource.id)}
                      className="bg-forest-700 hover:bg-forest-600 border border-forest-600 rounded-lg p-2 flex flex-col items-center gap-1"
                    >
                      <span className="text-2xl">{resource.icon}</span>
                      <span className="text-xs text-cream/80 truncate w-full text-center">{resource.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transitions' && (
            <div className="space-y-2">
              {availableRecipes.length === 0 ? (
                <p className="text-cream/60 text-center py-4">No recipes unlocked yet</p>
              ) : (
                availableRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAddTransition(recipe.id)}
                    className="w-full bg-forest-700 hover:bg-forest-600 border border-forest-600 rounded-lg p-3 flex items-center gap-3 text-left"
                  >
                    <span className="text-2xl">{recipe.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-cream font-medium">{recipe.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-cream/60">
                        {recipe.inputs.map((input, idx) => (
                          <span key={idx}>{RESOURCES[input.resource]?.icon ?? '?'}</span>
                        ))}
                        <span className="text-sage">→</span>
                        {recipe.outputs.map((output, idx) => (
                          <span key={idx}>{RESOURCES[output.resource]?.icon ?? '?'}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
