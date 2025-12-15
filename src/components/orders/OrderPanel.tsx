import { useMemo } from 'react';
import { useGameStore } from '../../state/gameStore';
import { CHARACTERS, getRandomFlavorText } from '../../data/characters';
import { RESOURCES } from '../../data/resources';

export function OrderPanel() {
  const orders = useGameStore(state => state.orders);
  const phase = useGameStore(state => state.phase);
  const tickCount = useGameStore(state => state.tickCount);

  const completedOrders = orders.filter(o => o.status === 'completed');

  // Generate stable flavor texts for each order (memoized by order IDs and statuses)
  const flavorTexts = useMemo(() => {
    const texts: Record<string, string> = {};
    for (const order of orders) {
      const type = order.status === 'completed' ? 'complete' : 'order';
      texts[order.id] = getRandomFlavorText(order.characterId, type);
    }
    return texts;
    // Only regenerate when order list changes or status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.map(o => `${o.id}:${o.status}`).join(',')]);

  return (
    <div className="bg-forest-700 border-b border-forest-600">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-forest-600 text-xs">
        <span className="text-cream/60">
          Orders: {completedOrders.length}/{orders.length} complete
        </span>
        {phase === 'design' && (
          <span className="text-sage">Plan your factory to serve all customers</span>
        )}
      </div>

      {/* Order cards */}
      <div className="flex gap-2 p-2 overflow-x-auto">
        {orders.map(order => {
          const character = CHARACTERS[order.characterId];
          const isActive = order.status === 'active';
          const isCompleted = order.status === 'completed';
          const isPending = order.status === 'pending';
          const willArriveIn = order.arrivalTick - tickCount;

          return (
            <div
              key={order.id}
              className={`flex-none w-28 rounded-lg p-2 border transition-all ${
                isCompleted
                  ? 'bg-sage/20 border-sage/50'
                  : order.status === 'failed'
                  ? 'bg-red-900/20 border-red-400/50'
                  : isActive
                  ? 'bg-forest-800 border-amber-warm/70'
                  : 'bg-forest-800/50 border-forest-600'
              }`}
            >
              {/* Character */}
              <div className="flex items-center gap-1 mb-1">
                <span className={`text-xl ${isPending ? 'opacity-50' : ''}`}>
                  {character?.portrait ?? '?'}
                </span>
                <span className={`text-xs truncate ${isCompleted ? 'text-sage' : isPending ? 'text-cream/40' : 'text-cream'}`}>
                  {character?.name ?? 'Unknown'}
                </span>
              </div>

              {/* Flavor text */}
              {(isActive || isCompleted) && flavorTexts[order.id] && (
                <p className={`text-xs italic mb-1 line-clamp-2 ${isCompleted ? 'text-sage/70' : 'text-cream/50'}`}>
                  "{flavorTexts[order.id]}"
                </p>
              )}

              {/* Items */}
              <div className="space-y-1">
                {order.items.map((item, idx) => {
                  const resource = RESOURCES[item.resource];
                  return (
                    <div key={idx} className={`flex items-center gap-1 text-sm ${isPending ? 'opacity-50' : ''}`}>
                      <span>{resource?.icon ?? '?'}</span>
                      <span className={`truncate ${isCompleted ? 'text-sage line-through' : 'text-cream/80'}`}>
                        {resource?.name ?? item.resource}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status indicator */}
              <div className="mt-2 text-xs">
                {isCompleted ? (
                  <span className="text-sage">+{order.reward}</span>
                ) : order.status === 'failed' ? (
                  <span className="text-red-400">Expired!</span>
                ) : isActive ? (
                  (() => {
                    const ticksLeft = order.deadlineTick - tickCount;
                    const urgency = ticksLeft <= 5 ? 'text-red-400' : ticksLeft <= 10 ? 'text-amber-warm' : 'text-cream/60';
                    return <span className={urgency}>{ticksLeft} ticks left</span>;
                  })()
                ) : phase === 'running' ? (
                  <span className="text-cream/40">In {willArriveIn} ticks</span>
                ) : (
                  <span className="text-cream/40">Arrives tick {order.arrivalTick}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
