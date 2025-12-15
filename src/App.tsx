import { useState, useEffect } from 'react';
import { useGameStore } from './state/gameStore';
import { FactoryCanvas } from './components/factory/FactoryCanvas';
import { OrderPanel } from './components/orders/OrderPanel';
import { RecipeBook } from './components/menus/RecipeBook';
import { BuildMenu } from './components/menus/BuildMenu';
import { NodeConfigPanel } from './components/menus/NodeConfigPanel';
import { LevelComplete } from './components/menus/LevelComplete';
import { InventoryPanel } from './components/menus/InventoryPanel';

function App() {
  const [showRecipes, setShowRecipes] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const phase = useGameStore(state => state.phase);
  const currentLevel = useGameStore(state => state.currentLevel);
  const isPaused = useGameStore(state => state.isPaused);
  const tickSpeed = useGameStore(state => state.tickSpeed);
  const tickCount = useGameStore(state => state.tickCount);
  const levelScore = useGameStore(state => state.levelScore);
  const runTick = useGameStore(state => state.runTick);
  const togglePause = useGameStore(state => state.togglePause);
  const resetLevel = useGameStore(state => state.resetLevel);

  // Game loop - only runs during 'running' phase
  useEffect(() => {
    if (phase !== 'running' || isPaused) return;

    const interval = setInterval(() => {
      runTick();
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [phase, isPaused, tickSpeed, runTick]);

  return (
    <div className="h-full flex flex-col bg-forest-900">
      {/* Level Header */}
      <header className="flex-none bg-forest-700 px-4 py-2 border-b border-forest-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-cream">{currentLevel?.name ?? 'Green Factory'}</h1>
            <p className="text-xs text-cream/60">{currentLevel?.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sage font-medium">{levelScore}</div>
            <div className="text-xs text-cream/40">
              {phase === 'design' ? 'Design Phase' : phase === 'running' ? `Tick ${tickCount}` : 'Complete'}
            </div>
          </div>
        </div>
      </header>

      {/* Order Panel - shows planned orders */}
      <OrderPanel />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <FactoryCanvas />

        {/* Node config panel */}
        <NodeConfigPanel />

        {/* Phase control button */}
        <button
          onClick={togglePause}
          className={`absolute top-2 right-2 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border ${
            phase === 'design'
              ? 'bg-sage text-forest-900 border-sage-light hover:bg-sage-light'
              : isPaused
              ? 'bg-forest-700/80 text-sage border-forest-600 hover:bg-forest-600'
              : 'bg-amber-warm/20 text-amber-warm border-amber-warm/50 hover:bg-amber-warm/30'
          }`}
        >
          {phase === 'design' ? (
            <>
              <span>▶</span>
              <span>Start</span>
            </>
          ) : isPaused ? (
            <>
              <span>▶</span>
              <span>Resume</span>
            </>
          ) : (
            <>
              <span>⏸</span>
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Reset button (during running/complete) */}
        {phase !== 'design' && (
          <button
            onClick={resetLevel}
            className="absolute top-2 left-2 bg-forest-700/80 hover:bg-forest-600 text-cream/60 hover:text-cream px-3 py-2 rounded-lg text-sm border border-forest-600"
          >
            Reset
          </button>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-forest-700 border-t border-forest-600 z-10">
        <div className="flex">
          <button
            onClick={() => setShowInventory(true)}
            className="flex-1 py-3 text-center transition-colors text-cream/60 hover:text-cream active:bg-forest-800 text-sm"
          >
            Inventory
          </button>
          <button
            onClick={() => setShowRecipes(true)}
            className="flex-1 py-3 text-center transition-colors text-cream/60 hover:text-cream active:bg-forest-800 text-sm"
          >
            Recipes
          </button>
          <button
            onClick={() => setShowBuild(true)}
            disabled={phase !== 'design'}
            className={`flex-1 py-3 text-center transition-colors text-sm font-medium ${
              phase === 'design'
                ? 'text-sage-light bg-sage/20 hover:bg-sage/30 active:bg-sage/40'
                : 'text-cream/30 bg-forest-800 cursor-not-allowed'
            }`}
          >
            + Build
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showRecipes && <RecipeBook onClose={() => setShowRecipes(false)} />}
      {showBuild && <BuildMenu onClose={() => setShowBuild(false)} />}
      {showInventory && <InventoryPanel onClose={() => setShowInventory(false)} />}
      {phase === 'complete' && <LevelComplete />}
    </div>
  );
}

export default App;
