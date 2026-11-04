import { useEffect, useRef, useState } from "react";

export const useEntrySignIn = () => {
  const initial = new URLSearchParams(location.search).get("state") ?? "ready";
  const [open, setOpen] = useState(initial !== "ready");
  const [state, setState] = useState<"ready" | "busy" | "error" | "cancelled">(
    initial === "busy" || initial === "error" || initial === "cancelled"
      ? initial
      : "ready",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  const close = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setOpen(false);
    setState("ready");
  };
  const show = () => {
    setOpen(true);
    setState("ready");
  };
  const start = () => {
    if (state === "busy") {
      return;
    }
    setState("busy");
    timer.current = setTimeout(() => setState("error"), 1400);
  };
  const preview = (value: string) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setOpen(value !== "ready");
    setState(
      value === "busy" || value === "error" || value === "cancelled"
        ? value
        : "ready",
    );
  };
  return { open, state, show, close, start, preview };
};
