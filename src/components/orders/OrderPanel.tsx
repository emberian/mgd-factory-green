import { useGameStore } from '../../state/gameStore';
import { CHARACTERS } from '../../data/characters';
import { RESOURCES } from '../../data/resources';

export function OrderPanel() {
  const orders = useGameStore(state => state.orders);
  const phase = useGameStore(state => state.phase);
  const tickCount = useGameStore(state => state.tickCount);

  const completedOrders = orders.filter(o => o.status === 'completed');

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
                  : isActive
                  ? 'bg-forest-800 border-sage animate-pulse'
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
                ) : isActive ? (
                  <span className="text-amber-warm">Waiting...</span>
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
