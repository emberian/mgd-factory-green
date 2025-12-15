import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { RESOURCES } from '../../data/resources';
import { getRecipe } from '../../data/recipes';
import type { Position } from '../../engine/petri/types';

const NODE_RADIUS = 30;
const TRANSITION_SIZE = 50;

interface CanvasState {
  offset: Position;
  scale: number;
  dragging: boolean;
  dragStart: Position;
  lastTouchDist: number | null;
}

export function FactoryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offset: { x: 0, y: 0 },
    scale: 1,
    dragging: false,
    dragStart: { x: 0, y: 0 },
    lastTouchDist: null,
  });

  const factory = useGameStore(state => state.factory);
  const selectedNode = useGameStore(state => state.selectedNode);
  const selectNode = useGameStore(state => state.selectNode);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: screenX, y: screenY };

    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - canvasState.offset.x) / canvasState.scale;
    const y = (screenY - rect.top - canvasState.offset.y) / canvasState.scale;
    return { x, y };
  }, [canvasState.offset, canvasState.scale]);

  // Draw the factory graph
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(canvasState.offset.x, canvasState.offset.y);
    ctx.scale(canvasState.scale, canvasState.scale);

    // Draw grid
    ctx.strokeStyle = '#243824';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const startX = Math.floor(-canvasState.offset.x / canvasState.scale / gridSize) * gridSize;
    const startY = Math.floor(-canvasState.offset.y / canvasState.scale / gridSize) * gridSize;
    const endX = startX + rect.width / canvasState.scale + gridSize * 2;
    const endY = startY + rect.height / canvasState.scale + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw connections (arcs)
    ctx.strokeStyle = '#5a965a';
    ctx.lineWidth = 2;

    for (const transition of Object.values(factory.transitions)) {
      // Input arcs
      for (const placeId of Object.keys(transition.inputs)) {
        const place = factory.places[placeId];
        if (place) {
          ctx.beginPath();
          ctx.moveTo(place.position.x, place.position.y);
          ctx.lineTo(transition.position.x, transition.position.y);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(
            transition.position.y - place.position.y,
            transition.position.x - place.position.x
          );
          const arrowX = transition.position.x - TRANSITION_SIZE / 2 * Math.cos(angle);
          const arrowY = transition.position.y - TRANSITION_SIZE / 2 * Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#5a965a';
          ctx.fill();
        }
      }

      // Output arcs
      for (const placeId of Object.keys(transition.outputs)) {
        const place = factory.places[placeId];
        if (place) {
          ctx.beginPath();
          ctx.moveTo(transition.position.x, transition.position.y);
          ctx.lineTo(place.position.x, place.position.y);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(
            place.position.y - transition.position.y,
            place.position.x - transition.position.x
          );
          const arrowX = place.position.x - NODE_RADIUS * Math.cos(angle);
          const arrowY = place.position.y - NODE_RADIUS * Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#5a965a';
          ctx.fill();
        }
      }
    }

    // Draw places (circles)
    for (const place of Object.values(factory.places)) {
      const isSelected = selectedNode?.type === 'place' && selectedNode.id === place.id;
      const resource = RESOURCES[place.resourceType];

      // Circle background
      ctx.beginPath();
      ctx.arc(place.position.x, place.position.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#3d5c3d' : '#2d4a2d';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#a8d9a8' : '#7cb87c';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Token count indicator (fill level)
      if (place.tokens > 0) {
        const fillPercent = place.tokens / place.capacity;
        ctx.beginPath();
        ctx.arc(place.position.x, place.position.y, NODE_RADIUS - 4, 0, Math.PI * 2);
        ctx.fillStyle = resource?.color ?? '#7cb87c';
        ctx.globalAlpha = 0.3 + fillPercent * 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Icon
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8f5e8';
      ctx.fillText(resource?.icon ?? '?', place.position.x, place.position.y - 5);

      // Token count
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(`${place.tokens}/${place.capacity}`, place.position.x, place.position.y + 15);
    }

    // Draw transitions (rectangles)
    for (const transition of Object.values(factory.transitions)) {
      const isSelected = selectedNode?.type === 'transition' && selectedNode.id === transition.id;
      const recipe = getRecipe(transition.recipeId);

      // Rectangle background
      ctx.fillStyle = isSelected ? '#3d5c3d' : '#2d4a2d';
      ctx.fillRect(
        transition.position.x - TRANSITION_SIZE / 2,
        transition.position.y - TRANSITION_SIZE / 2,
        TRANSITION_SIZE,
        TRANSITION_SIZE
      );
      ctx.strokeStyle = isSelected ? '#a8d9a8' : '#7cb87c';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(
        transition.position.x - TRANSITION_SIZE / 2,
        transition.position.y - TRANSITION_SIZE / 2,
        TRANSITION_SIZE,
        TRANSITION_SIZE
      );

      // Cooldown indicator
      if (transition.cooldownRemaining > 0 && recipe) {
        const progress = 1 - transition.cooldownRemaining / recipe.duration;
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(
          transition.position.x - TRANSITION_SIZE / 2 + 2,
          transition.position.y + TRANSITION_SIZE / 2 - 6,
          (TRANSITION_SIZE - 4) * progress,
          4
        );
      }

      // Icon
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8f5e8';
      ctx.fillText(recipe?.icon ?? '?', transition.position.x, transition.position.y);
    }

    ctx.restore();

    // Draw empty state hint
    if (Object.keys(factory.places).length === 0 && Object.keys(factory.transitions).length === 0) {
      ctx.fillStyle = '#4d6e4d';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tap "Build" to add nodes', rect.width / 2, rect.height / 2);
    }
  }, [factory, selectedNode, canvasState]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Find node at position
  const findNodeAt = useCallback((worldPos: Position) => {
    // Check transitions first (on top)
    for (const transition of Object.values(factory.transitions)) {
      const dx = worldPos.x - transition.position.x;
      const dy = worldPos.y - transition.position.y;
      if (Math.abs(dx) < TRANSITION_SIZE / 2 && Math.abs(dy) < TRANSITION_SIZE / 2) {
        return { type: 'transition' as const, id: transition.id };
      }
    }

    // Check places
    for (const place of Object.values(factory.places)) {
      const dx = worldPos.x - place.position.x;
      const dy = worldPos.y - place.position.y;
      if (Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS) {
        return { type: 'place' as const, id: place.id };
      }
    }

    return null;
  }, [factory]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setCanvasState(prev => ({
        ...prev,
        dragging: true,
        dragStart: { x: touch.clientX - prev.offset.x, y: touch.clientY - prev.offset.y },
      }));
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setCanvasState(prev => ({ ...prev, lastTouchDist: dist }));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && canvasState.dragging) {
      const touch = e.touches[0];
      setCanvasState(prev => ({
        ...prev,
        offset: {
          x: touch.clientX - prev.dragStart.x,
          y: touch.clientY - prev.dragStart.y,
        },
      }));
    } else if (e.touches.length === 2 && canvasState.lastTouchDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / canvasState.lastTouchDist;
      setCanvasState(prev => ({
        ...prev,
        scale: Math.max(0.5, Math.min(2, prev.scale * scaleFactor)),
        lastTouchDist: dist,
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setCanvasState(prev => ({ ...prev, dragging: false, lastTouchDist: null }));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(worldPos);
    selectNode(node);
  };

  // Mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setCanvasState(prev => ({
        ...prev,
        dragging: true,
        dragStart: { x: e.clientX - prev.offset.x, y: e.clientY - prev.offset.y },
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasState.dragging) {
      setCanvasState(prev => ({
        ...prev,
        offset: {
          x: e.clientX - prev.dragStart.x,
          y: e.clientY - prev.dragStart.y,
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setCanvasState(prev => ({ ...prev, dragging: false }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(2, prev.scale * scaleFactor)),
    }));
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
