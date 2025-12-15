import { useGameStore } from '../../state/gameStore';
import { RECIPES } from '../../data/recipes';
import { RESOURCES } from '../../data/resources';

interface RecipeBookProps {
  onClose: () => void;
}

export function RecipeBook({ onClose }: RecipeBookProps) {
  const currentLevel = useGameStore(state => state.currentLevel);

  // Show all recipes, highlight which are available in this level
  const recipes = Object.values(RECIPES);
  const levelRecipeIds = currentLevel?.availableRecipes ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-forest-800 rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest-600">
          <h2 className="text-lg font-semibold text-cream">Recipe Book</h2>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-cream p-1"
          >
            Close
          </button>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {recipes.map(recipe => {
            const isAvailable = levelRecipeIds.includes(recipe.id);

            return (
              <div
                key={recipe.id}
                className={`bg-forest-700 rounded-lg p-3 border ${
                  isAvailable ? 'border-sage/50' : 'border-forest-600/50 opacity-60'
                }`}
              >
                {/* Recipe header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{recipe.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-cream font-medium">{recipe.name}</h3>
                    <p className="text-xs text-cream/60">{recipe.description}</p>
                  </div>
                  {isAvailable && (
                    <span className="px-2 py-0.5 bg-sage/20 text-sage text-xs rounded">
                      Available
                    </span>
                  )}
                </div>

                {/* Inputs and outputs */}
                <div className="flex items-center gap-2 text-sm">
                  {/* Inputs */}
                  <div className="flex items-center gap-1">
                    {recipe.inputs.map((input, idx) => {
                      const resource = RESOURCES[input.resource];
                      return (
                        <span key={idx} className="flex items-center gap-0.5 bg-forest-600 px-1.5 py-0.5 rounded">
                          <span>{resource?.icon ?? '?'}</span>
                          <span className="text-cream/80">x{input.amount}</span>
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-sage">→</span>

                  {/* Outputs */}
                  <div className="flex items-center gap-1">
                    {recipe.outputs.map((output, idx) => {
                      const resource = RESOURCES[output.resource];
                      return (
                        <span key={idx} className="flex items-center gap-0.5 bg-sage/20 px-1.5 py-0.5 rounded">
                          <span>{resource?.icon ?? '?'}</span>
                          <span className="text-sage-light">x{output.amount}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Duration */}
                  <span className="ml-auto text-cream/40 text-xs">
                    {recipe.duration} tick{recipe.duration !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
