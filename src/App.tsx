import { useState, useEffect } from 'react';
import { useGameStore } from './state/gameStore';
import { FactoryCanvas } from './components/factory/FactoryCanvas';
import { OrderPanel } from './components/orders/OrderPanel';
import { RecipeBook } from './components/menus/RecipeBook';
import { BuildMenu } from './components/menus/BuildMenu';
import { NodeConfigPanel } from './components/menus/NodeConfigPanel';

function App() {
  const [showRecipes, setShowRecipes] = useState(false);
  const [showBuild, setShowBuild] = useState(false);

  const isPaused = useGameStore(state => state.isPaused);
  const tickSpeed = useGameStore(state => state.tickSpeed);
  const tickCount = useGameStore(state => state.tickCount);
  const activeOrders = useGameStore(state => state.activeOrders);
  const runTick = useGameStore(state => state.runTick);
  const togglePause = useGameStore(state => state.togglePause);
  const generateOrder = useGameStore(state => state.generateOrder);

  // Game loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      runTick();
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [isPaused, tickSpeed, runTick]);

  // Generate orders periodically
  useEffect(() => {
    if (isPaused) return;
    if (activeOrders.length >= 3) return; // Max 3 active orders

    // Generate order roughly every 30 ticks
    if (tickCount > 0 && tickCount % 30 === 0) {
      generateOrder();
    }
  }, [tickCount, isPaused, activeOrders.length, generateOrder]);

  // Generate initial order
  useEffect(() => {
    if (activeOrders.length === 0) {
      generateOrder();
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-forest-900">
      {/* Order Panel */}
      <OrderPanel />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <FactoryCanvas />

        {/* Node config panel (slides up when node selected) */}
        <NodeConfigPanel />

        {/* Play/Pause overlay button */}
        <button
          onClick={togglePause}
          className="absolute top-2 right-2 bg-forest-700/80 hover:bg-forest-600 text-cream px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-forest-600"
        >
          {isPaused ? (
            <>
              <span className="text-sage">▶</span>
              <span>Play</span>
            </>
          ) : (
            <>
              <span className="text-amber-warm">⏸</span>
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Tick counter */}
        <div className="absolute top-2 left-2 bg-forest-700/80 text-cream/60 px-2 py-1 rounded text-xs">
          Tick: {tickCount}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-forest-700 border-t border-forest-600 z-10">
        <div className="flex">
          <button
            onClick={() => setShowRecipes(true)}
            className="flex-1 py-4 text-center transition-colors text-cream/60 hover:text-cream active:bg-forest-800"
          >
            Recipes
          </button>
          <button
            onClick={() => setShowBuild(true)}
            className="flex-1 py-4 text-center transition-colors text-sage-light bg-sage/20 hover:bg-sage/30 active:bg-sage/40 font-medium"
          >
            + Build
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showRecipes && <RecipeBook onClose={() => setShowRecipes(false)} />}
      {showBuild && <BuildMenu onClose={() => setShowBuild(false)} />}
    </div>
  );
}

export default App;
