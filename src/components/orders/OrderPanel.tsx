import { useGameStore } from '../../state/gameStore';
import { CHARACTERS } from '../../data/characters';
import { RESOURCES } from '../../data/resources';

export function OrderPanel() {
  const activeOrders = useGameStore(state => state.activeOrders);
  const completedOrderCount = useGameStore(state => state.completedOrderCount);
  const currency = useGameStore(state => state.currency);

  if (activeOrders.length === 0) {
    return (
      <div className="bg-forest-700 border-b border-forest-600 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-cream/60 text-sm">Orders: {completedOrderCount} completed</span>
          <span className="text-sage font-medium">{currency}</span>
        </div>
        <p className="text-forest-500 text-sm text-center py-2">
          No customers waiting...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-forest-700 border-b border-forest-600">
      <div className="flex items-center justify-between px-4 py-2 border-b border-forest-600">
        <span className="text-cream/60 text-sm">
          {activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} pending
        </span>
        <span className="text-sage font-medium">{currency}</span>
      </div>

      <div className="flex gap-2 p-2 overflow-x-auto">
        {activeOrders.map(order => {
          const character = CHARACTERS[order.characterId];
          const urgencyPercent = order.timeLimit / 60;

          return (
            <div
              key={order.id}
              className="flex-none w-28 bg-forest-800 rounded-lg p-2 border border-forest-600"
            >
              {/* Character */}
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xl">{character?.portrait ?? '?'}</span>
                <span className="text-xs text-cream truncate">{character?.name ?? 'Unknown'}</span>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {order.items.map((item, idx) => {
                  const resource = RESOURCES[item.resource];
                  return (
                    <div key={idx} className="flex items-center gap-1 text-sm">
                      <span>{resource?.icon ?? '?'}</span>
                      <span className="text-cream/80 truncate">{resource?.name ?? item.resource}</span>
                      <span className="text-sage-light ml-auto">x{item.amount}</span>
                    </div>
                  );
                })}
              </div>

              {/* Timer bar */}
              <div className="mt-2 h-1 bg-forest-600 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, urgencyPercent * 100)}%`,
                    backgroundColor: urgencyPercent > 0.5 ? '#5bb85b' : urgencyPercent > 0.25 ? '#d4a574' : '#b85b5b',
                  }}
                />
              </div>

              {/* Reward */}
              <div className="mt-1 text-xs text-sage text-right">
                +{order.reward}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
