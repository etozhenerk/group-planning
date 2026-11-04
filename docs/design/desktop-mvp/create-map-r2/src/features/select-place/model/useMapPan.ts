import { useRef, useState } from "react";
import type { PointerEvent } from "react";

export const useMapPan = (point: (x: number, y: number) => void) => {
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const gesture = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest("button,a"))
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      panX: view.x,
      panY: view.y,
      moved: false,
    };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start) {
      return;
    }
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > 5) {
      start.moved = true;
    }
    if (start.moved) {
      setView((previous) => ({
        ...previous,
        x: Math.max(-150, Math.min(150, start.panX + dx)),
        y: Math.max(-90, Math.min(90, start.panY + dy)),
      }));
    }
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (start && !start.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      const width = rect.width + 320;
      const height = rect.height + 200;
      point(
        (((event.clientX - rect.left + 160 - view.x - width / 2) / view.zoom +
          width / 2) /
          width) *
          100,
        (((event.clientY - rect.top + 100 - view.y - height / 2) / view.zoom +
          height / 2) /
          height) *
          100,
      );
    }
  };
  return {
    view,
    down,
    move,
    up,
    cancel: () => {
      gesture.current = null;
    },
    zoom: (amount: number) =>
      setView((previous) => ({
        ...previous,
        zoom: Math.max(1, Math.min(1.8, previous.zoom + amount)),
      })),
  };
};
