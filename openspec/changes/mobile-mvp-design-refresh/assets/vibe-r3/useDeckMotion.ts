import { useEffect, useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
export const useDeckMotion = (count: number) => {
  const [index, setIndex] = useState(0),
    [offset, setOffset] = useState(0),
    [vertical, setVertical] = useState(0),
    [phase, setPhase] = useState("idle"),
    [grid, setGridState] = useState(false),
    [recycledIndex, setRecycledIndex] = useState<number | null>(null),
    [duration, setDuration] = useState(240);
  const element = useRef<HTMLDivElement | null>(null);
  const current = useRef(0),
    live = useRef(0),
    phaseRef = useRef("idle"),
    blocked = useRef(false),
    timer = useRef<number | undefined>(),
    frame = useRef<number | undefined>(),
    pending = useRef<number | null>(null),
    pointer = useRef<{
      id: number;
      x: number;
      y: number;
      lastX: number;
      time: number;
      velocity: number;
      axis: string;
      width: number;
    } | null>(null);
  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = (next: string) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const clear = () => {
    window.clearTimeout(timer.current);
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    pointer.current = null;
  };
  const select = (next: number) => {
    clear();
    pending.current = null;
    current.current = count ? ((next % count) + count) % count : 0;
    setIndex(current.current);
    live.current = 0;
    setOffset(0);
    setVertical(0);
    setRecycledIndex(null);
    stage("idle");
  };
  const settle = () => {
    live.current = 0;
    setOffset(0);
    setVertical(0);
    if (reduced()) {
      stage("idle");
      return;
    }
    setDuration(220);
    stage("returning");
    timer.current = window.setTimeout(() => stage("idle"), 220);
  };
  const exit = (
    direction: number,
    next: number,
    velocity: number,
    cycle: boolean,
    width: number,
  ) => {
    pending.current = next;
    blocked.current = true;
    if (reduced()) {
      select(next);
      return;
    }
    const old = current.current,
      target = direction * (window.innerWidth + width),
      ms = Math.round(
        Math.min(
          320,
          Math.max(
            180,
            Math.abs(target - live.current) / (Math.abs(velocity) + 2),
          ),
        ),
      );
    setDuration(ms);
    stage("exiting");
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        setOffset(target);
        setVertical(0);
        timer.current = window.setTimeout(() => {
          current.current = next;
          setIndex(next);
          pending.current = null;
          live.current = 0;
          setOffset(0);
          setVertical(0);
          if (cycle) {
            stage("assembling");
            timer.current = window.setTimeout(() => stage("idle"), 300);
          } else {
            stage("handoff");
            setRecycledIndex(old);
            frame.current = requestAnimationFrame(() => {
              frame.current = requestAnimationFrame(() => {
                setRecycledIndex(null);
                stage("idle");
              });
            });
          }
        }, ms);
      });
    });
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      phaseRef.current !== "idle" ||
      count < 1 ||
      (event.target instanceof Element &&
        !event.target.closest('[data-front="true"]'))
    )
      return;
    blocked.current = false;
    const width =
      event.currentTarget
        .querySelector('[data-front="true"]')
        ?.getBoundingClientRect().width ?? event.currentTarget.clientWidth;
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      time: event.timeStamp,
      velocity: 0,
      axis: "pending",
      width,
    };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const origin = pointer.current;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x,
      dy = event.clientY - origin.y;
    if (origin.axis === "pending") {
      if (Math.hypot(dx, dy) < 8) return;
      blocked.current = true;
      if (Math.abs(dy) > Math.abs(dx) * 1.1) {
        pointer.current = null;
        return;
      }
      origin.axis = "horizontal";
      stage("dragging");
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const elapsed = Math.max(8, event.timeStamp - origin.time);
    origin.velocity =
      0.35 * origin.velocity +
      (0.65 * (event.clientX - origin.lastX)) / elapsed;
    origin.lastX = event.clientX;
    origin.time = event.timeStamp;
    live.current = dx;
    setOffset(dx);
    setVertical(Math.max(-16, Math.min(16, dy * 0.15)));
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    const origin = pointer.current;
    if (!origin || origin.id !== event.pointerId) return;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (origin.axis !== "horizontal") return;
    const dx = live.current,
      velocity = event.timeStamp - origin.time > 90 ? 0 : origin.velocity,
      threshold = Math.min(90, Math.max(48, origin.width * 0.24));
    if (
      count > 1 &&
      (Math.abs(dx) >= threshold ||
        (Math.abs(dx) > 18 && Math.abs(velocity) > 0.5))
    ) {
      const next = (current.current + 1) % count;
      exit(
        Math.sign(dx || velocity),
        next,
        velocity,
        current.current === count - 1,
        origin.width,
      );
    } else settle();
  };
  const cancel = () => {
    if (!pointer.current) return;
    pointer.current = null;
    blocked.current = true;
    settle();
  };
  const lostCapture = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) cancel();
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      count > 1 &&
      phaseRef.current === "idle"
    ) {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1,
        next = (current.current + step + count) % count;
      exit(-step, next, 1, false, event.currentTarget.clientWidth);
    }
  };
  const setGrid = (next: boolean) => {
    if (pending.current !== null) select(pending.current);
    else if (phaseRef.current !== "idle") select(current.current);
    setGridState(next);
  };
  useEffect(() => {
    const deck = element.current;
    if (!deck) return;
    let wheelTimer: number | undefined;
    let active = false,
      consumed = false,
      total = 0,
      lastTime = 0,
      velocity = 0;
    const finish = () => {
      if (!active || consumed) {
        active = false;
        consumed = false;
        return;
      }
      active = false;
      const width =
        deck.querySelector('[data-front="true"]')?.getBoundingClientRect()
          .width ?? deck.clientWidth;
      const threshold = Math.min(90, Math.max(48, width * 0.24));
      if (
        count > 1 &&
        (Math.abs(total) >= threshold ||
          (Math.abs(total) > 18 && Math.abs(velocity) > 0.5))
      ) {
        exit(
          Math.sign(total),
          (current.current + 1) % count,
          velocity,
          current.current === count - 1,
          width,
        );
      } else settle();
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || pointer.current) return;
      const scale =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? deck.clientWidth
            : 1;
      const dx = (event.deltaX || (event.shiftKey ? event.deltaY : 0)) * scale;
      if (
        !active &&
        Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY * scale)
      )
        return;
      event.preventDefault();
      window.clearTimeout(wheelTimer);
      if (!active) {
        if (phaseRef.current !== "idle") return;
        active = true;
        consumed = false;
        total = 0;
        velocity = 0;
        lastTime = 0;
        blocked.current = true;
        stage("dragging");
      }
      if (consumed) {
        wheelTimer = window.setTimeout(() => {
          active = false;
          consumed = false;
        }, 160);
        return;
      }
      velocity = lastTime
        ? 0.35 * velocity +
          (0.65 * -dx) / Math.max(8, event.timeStamp - lastTime)
        : 0;
      lastTime = event.timeStamp;
      total = Math.max(
        -deck.clientWidth,
        Math.min(deck.clientWidth, total - dx),
      );
      live.current = total;
      setOffset(total);
      setVertical(0);
      if (Math.abs(total) > deck.clientWidth * 0.45 && count > 1) {
        consumed = true;
        const width =
          deck.querySelector('[data-front="true"]')?.getBoundingClientRect()
            .width ?? deck.clientWidth;
        exit(
          Math.sign(total),
          (current.current + 1) % count,
          velocity,
          current.current === count - 1,
          width,
        );
        wheelTimer = window.setTimeout(() => {
          active = false;
          consumed = false;
        }, 160);
      } else wheelTimer = window.setTimeout(finish, 110);
    };
    deck.addEventListener("wheel", wheel, { passive: false });
    return () => {
      deck.removeEventListener("wheel", wheel);
      window.clearTimeout(wheelTimer);
    };
  }, [count, grid]);
  useEffect(() => () => clear(), []);
  useEffect(() => {
    if (index >= count && count > 0) select(count - 1);
  }, [count]);
  return {
    element,
    index,
    select,
    offset,
    vertical,
    phase,
    recycledIndex,
    duration,
    progress: Math.min(
      1,
      Math.abs(offset) /
        Math.max(
          1,
          typeof window === "undefined" ? 350 : window.innerWidth * 0.8,
        ),
    ),
    grid,
    setGrid,
    moving: ["exiting", "assembling", "handoff"].includes(phase),
    resetting: phase === "assembling",
    start,
    move,
    end,
    cancel,
    lostCapture,
    keyboard,
    canOpen: () => !blocked.current && phaseRef.current === "idle",
  };
};
