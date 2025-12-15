import { useGameStore } from '../../state/gameStore';
import { LEVELS } from '../../data/levels';

interface LevelSelectProps {
  onClose: () => void;
}

export function LevelSelect({ onClose }: LevelSelectProps) {
  const currentLevelIndex = useGameStore(state => state.currentLevelIndex);
  const unlockedLevels = useGameStore(state => state.unlockedLevels);
  const loadLevel = useGameStore(state => state.loadLevel);

  const handleSelectLevel = (levelIndex: number) => {
    if (levelIndex <= unlockedLevels) {
      loadLevel(levelIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-forest-800 rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest-600">
          <h2 className="text-lg font-semibold text-cream">Select Level</h2>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-cream p-1"
          >
            Close
          </button>
        </div>

        {/* Level list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {LEVELS.map((level, index) => {
            const isUnlocked = index <= unlockedLevels;
            const isCurrent = index === currentLevelIndex;

            return (
              <button
                key={level.id}
                onClick={() => handleSelectLevel(index)}
                disabled={!isUnlocked}
                className={`w-full text-left rounded-lg p-3 border transition-all ${
                  isCurrent
                    ? 'bg-sage/20 border-sage'
                    : isUnlocked
                    ? 'bg-forest-700 border-forest-600 hover:border-sage/50 hover:bg-forest-600'
                    : 'bg-forest-800/50 border-forest-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Level number */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isUnlocked ? 'bg-sage/30 text-sage-light' : 'bg-forest-700 text-cream/40'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Level info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${isUnlocked ? 'text-cream' : 'text-cream/40'}`}>
                        {level.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-sage/30 text-sage text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isUnlocked ? 'text-cream/60' : 'text-cream/30'}`}>
                      {level.description}
                    </p>
                  </div>

                  {/* Lock indicator */}
                  {!isUnlocked && (
                    <span className="text-cream/40 text-lg">🔒</span>
                  )}
                </div>

                {/* Level details */}
                {isUnlocked && (
                  <div className="mt-2 pt-2 border-t border-forest-600 flex gap-4 text-xs text-cream/50">
                    <span>{level.orders.length} order{level.orders.length !== 1 ? 's' : ''}</span>
                    <span>{level.availableRecipes.length} recipe{level.availableRecipes.length !== 1 ? 's' : ''}</span>
                    <span>Target: {level.targetScore}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress summary */}
        <div className="px-4 py-3 border-t border-forest-600 text-center text-sm text-cream/60">
          {unlockedLevels + 1} of {LEVELS.length} levels unlocked
        </div>
      </div>
    </div>
  );
}
