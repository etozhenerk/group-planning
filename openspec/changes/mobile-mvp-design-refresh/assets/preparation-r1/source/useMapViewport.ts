import { useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
export const useMapViewport = (selectPoint: () => void) => {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 }),
    pointers = useRef(new Map<number, { x: number; y: number }>()),
    start = useRef({ x: 0, y: 0 }),
    base = useRef(view),
    distance = useRef(1),
    moved = useRef(false);
  const gap = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 1;
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    event.preventDefault();
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    base.current = view;
    start.current = { x: event.clientX, y: event.clientY };
    if (pointers.current.size === 1) moved.current = false;
    else {
      moved.current = true;
      distance.current = gap();
    }
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointers.current.size >= 2) {
      moved.current = true;
      setView({
        ...base.current,
        scale: Math.min(
          2.2,
          Math.max(0.8, (base.current.scale * gap()) / distance.current),
        ),
      });
      return;
    }
    const dx = event.clientX - start.current.x,
      dy = event.clientY - start.current.y;
    if (Math.hypot(dx, dy) > 8) moved.current = true;
    setView({
      ...base.current,
      x: Math.max(-140, Math.min(140, base.current.x + dx)),
      y: Math.max(-180, Math.min(180, base.current.y + dy)),
    });
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const tap = !moved.current && pointers.current.size === 1;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (tap) selectPoint();
    const remaining = [...pointers.current.values()][0];
    if (remaining) {
      base.current = view;
      start.current = remaining;
      moved.current = true;
    }
  };
  const cancel = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    moved.current = true;
  };
  const zoom = (delta: number) =>
    setView((previous) => ({
      ...previous,
      scale: Math.max(0.8, Math.min(2.2, previous.scale + delta)),
    }));
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const shifts: Record<string, [number, number]> = {
      ArrowLeft: [-30, 0],
      ArrowRight: [30, 0],
      ArrowUp: [0, -30],
      ArrowDown: [0, 30],
    };
    if (shifts[event.key]) {
      event.preventDefault();
      const [x, y] = shifts[event.key];
      setView((previous) => ({
        ...previous,
        x: Math.max(-140, Math.min(140, previous.x + x)),
        y: Math.max(-180, Math.min(180, previous.y + y)),
      }));
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectPoint();
    }
  };
  return {
    view,
    zoom,
    events: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: up,
      onPointerCancel: cancel,
      onKeyDown: keyDown,
    },
  };
};
