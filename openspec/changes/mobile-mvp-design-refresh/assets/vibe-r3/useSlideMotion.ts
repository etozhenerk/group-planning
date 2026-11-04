import { useEffect, useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
export const useSlideMotion = (
  count: number,
  change: (step: -1 | 1) => void,
) => {
  const element = useRef<HTMLDivElement | null>(null),
    commit = useRef(change);
  commit.current = change;
  const [offset, setOffset] = useState(0),
    [phase, setPhase] = useState("idle");
  const state = useRef("idle"),
    live = useRef(0),
    timer = useRef<number>(),
    frame = useRef<number>();
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    lastX: number;
    time: number;
    velocity: number;
    axis: string;
  } | null>(null);
  const stage = (next: string) => {
    state.current = next;
    setPhase(next);
  };
  const reduced = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  const settle = () => {
    live.current = 0;
    setOffset(0);
    stage(reduced() ? "idle" : "returning");
    if (!reduced()) timer.current = window.setTimeout(() => stage("idle"), 220);
  };
  const slide = (step: -1 | 1) => {
    if (count < 2) return settle();
    if (reduced()) {
      commit.current(step);
      setOffset(0);
      live.current = 0;
      stage("idle");
      return;
    }
    stage("exiting");
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        setOffset(-step * (element.current?.clientWidth ?? innerWidth));
        timer.current = window.setTimeout(() => {
          commit.current(step);
          setOffset(0);
          live.current = 0;
          stage("idle");
        }, 260);
      });
    });
  };
  const finish = (velocity = 0) => {
    const dx = live.current,
      width = element.current?.clientWidth ?? innerWidth;
    if (
      count > 1 &&
      (Math.abs(dx) > Math.max(48, width * 0.2) ||
        (Math.abs(dx) > 22 && Math.abs(velocity) > 0.5))
    )
      slide(dx < 0 ? 1 : -1);
    else settle();
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || state.current !== "idle") return;
    pointer.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      time: e.timeStamp,
      velocity: 0,
      axis: "pending",
    };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y;
    if (p.axis === "pending") {
      if (Math.hypot(dx, dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.1) {
        pointer.current = null;
        return;
      }
      p.axis = "horizontal";
      stage("dragging");
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
    p.velocity =
      0.35 * p.velocity +
      (0.65 * (e.clientX - p.lastX)) / Math.max(8, e.timeStamp - p.time);
    p.lastX = e.clientX;
    p.time = e.timeStamp;
    live.current = dx;
    setOffset(dx);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    pointer.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (p.axis === "horizontal")
      finish(e.timeStamp - p.time > 90 ? 0 : p.velocity);
  };
  const cancel = () => {
    if (pointer.current) {
      pointer.current = null;
      settle();
    }
  };
  const key = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (
      (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
      state.current === "idle"
    ) {
      e.preventDefault();
      slide(e.key === "ArrowRight" ? 1 : -1);
    }
  };
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    let active = false,
      total = 0,
      wheelTimer: number | undefined;
    const wheel = (e: WheelEvent) => {
      const scale =
          e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1,
        dx = (e.deltaX || (e.shiftKey ? e.deltaY : 0)) * scale;
      if (
        e.ctrlKey ||
        pointer.current ||
        (!active && Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY * scale))
      )
        return;
      e.preventDefault();
      if (!active) {
        if (state.current !== "idle") return;
        active = true;
        total = 0;
        stage("dragging");
      }
      total = Math.max(-el.clientWidth, Math.min(el.clientWidth, total - dx));
      live.current = total;
      setOffset(total);
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        active = false;
        finish();
      }, 100);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", wheel);
      clearTimeout(wheelTimer);
    };
  }, [count]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    [],
  );
  return { element, offset, phase, down, move, up, cancel, key };
};
