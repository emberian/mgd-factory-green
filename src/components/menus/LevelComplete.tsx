import { useGameStore } from '../../state/gameStore';
import { LEVELS } from '../../data/levels';

export function LevelComplete() {
  const orders = useGameStore(state => state.orders);
  const levelScore = useGameStore(state => state.levelScore);
  const currentLevel = useGameStore(state => state.currentLevel);
  const currentLevelIndex = useGameStore(state => state.currentLevelIndex);
  const unlockedLevels = useGameStore(state => state.unlockedLevels);
  const loadLevel = useGameStore(state => state.loadLevel);
  const resetLevel = useGameStore(state => state.resetLevel);

  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalOrders = orders.length;
  const allCompleted = completedOrders === totalOrders;
  const hasNextLevel = currentLevelIndex + 1 < LEVELS.length;
  const canPlayNext = hasNextLevel && unlockedLevels > currentLevelIndex;

  // Calculate stars based on score vs target
  const targetScore = currentLevel?.targetScore ?? 0;
  const stars = levelScore >= targetScore ? 3 : levelScore >= targetScore * 0.7 ? 2 : levelScore > 0 ? 1 : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-forest-800 rounded-2xl w-full max-w-sm p-6 text-center">
        {/* Result header */}
        <h2 className={`text-2xl font-bold mb-2 ${allCompleted ? 'text-sage-light' : 'text-amber-warm'}`}>
          {allCompleted ? 'Level Complete!' : 'Level Failed'}
        </h2>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              className={`text-3xl ${i <= stars ? 'text-amber-warm' : 'text-forest-600'}`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-forest-700 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-cream/60">Orders completed</span>
            <span className="text-cream">{completedOrders}/{totalOrders}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-cream/60">Score earned</span>
            <span className="text-sage">{levelScore}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-cream/60">Target score</span>
            <span className="text-cream/40">{targetScore}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={resetLevel}
            className="flex-1 py-3 bg-forest-600 hover:bg-forest-500 text-cream rounded-lg font-medium"
          >
            Retry
          </button>
          {canPlayNext && (
            <button
              onClick={() => loadLevel(currentLevelIndex + 1)}
              className="flex-1 py-3 bg-sage hover:bg-sage-light text-forest-900 rounded-lg font-medium"
            >
              Next Level
            </button>
          )}
        </div>

        {/* Level select hint */}
        {!canPlayNext && hasNextLevel && (
          <p className="mt-3 text-xs text-cream/40">
            Complete all orders to unlock the next level
          </p>
        )}
      </div>
    </div>
  );
}
