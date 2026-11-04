import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CalendarMeeting } from "@/entities/meeting";
import {
  upcoming,
  past,
  undated,
  crowded,
} from "@list/pages/meetings/model/data";

export const useMeetingsPreview = () => {
  const params = new URLSearchParams(location.search);
  const [saved] = useState(readContext);
  const [view, setView] = useState<"list" | "calendar">(
    params.get("view") === "calendar"
      ? "calendar"
      : params.get("view") === "list"
        ? "list"
        : saved.view,
  );
  const [period, setPeriod] = useState<"upcoming" | "past">(saved.period);
  const [state, setState] = useState(params.get("state") ?? saved.state);
  const [noDate, setNoDate] = useState(saved.noDate);
  const [day, setDay] = useState(saved.day);
  const body = useRef<HTMLDivElement>(null);
  const positions = useRef(saved.positions);
  const days = useRef({ upcoming: "2026-11-06", past: "2026-10-30" });
  const updateView = (next: "list" | "calendar") => {
    positions.current[view] = body.current?.scrollTop ?? 0;
    if (next === "calendar") setNoDate(false);
    setView(next);
  };
  const updatePeriod = (next: "upcoming" | "past") => {
    if (next === period) return;
    days.current[period] = day;
    setPeriod(next);
    setDay(days.current[next]);
    setNoDate(false);
    positions.current = { list: 0, calendar: 0 };
    if (body.current) body.current.scrollTop = 0;
  };
  const updateState = (next: string) => {
    setState(next);
    setNoDate(false);
    setDay(next === "empty-day" ? "2026-11-09" : "2026-11-06");
    if (body.current) body.current.scrollTop = 0;
  };
  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = positions.current[view];
  }, [view]);
  useEffect(() => {
    const remember = () => {
      positions.current[view] = body.current?.scrollTop ?? 0;
      sessionStorage.setItem(
        contextKey,
        JSON.stringify({
          view,
          period,
          state,
          noDate,
          day,
          positions: positions.current,
        }),
      );
    };
    remember();
    const element = body.current;
    element?.addEventListener("scroll", remember, { passive: true });
    return () => element?.removeEventListener("scroll", remember);
  }, [view, period, state, noDate, day]);
  const all =
    state === "empty"
      ? []
      : state === "twenty"
        ? [...crowded, ...upcoming.filter((item) => item.id !== baseId)]
        : upcoming;
  const source = noDate
    ? state === "empty"
      ? []
      : undated
    : period === "past"
      ? state === "empty"
        ? []
        : past
      : all;
  const items = source.map((item) =>
    state === "long" && item.id === "chat-dinner"
      ? {
          ...item,
          title: "Большой вечер настольных игр, пиццы и разговоров до утра",
          place:
            "Кафе «Соседи», второй этаж у окна, большой стол у дальней стены",
        }
      : state === "many-unread" && item.id === "chat-dinner"
        ? { ...item, unreadCount: "127" }
        : item,
  );
  const groups = new Map<string, CalendarMeeting[]>();
  for (const item of items) {
    const key = item.localDate?.slice(0, 7) ?? "undated";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const page = {
    meetings: items,
    days: [
      ...new Set(
        items
          .map((item) => item.localDate)
          .filter((value): value is string => !!value),
      ),
    ].map((date) => ({
      date,
      count: items.filter((item) => item.localDate === date).length,
    })),
    counts: {
      upcoming: all.length,
      past: state === "empty" ? 0 : past.length,
      undated: state === "empty" ? 0 : undated.length,
    },
    asOf: "2026-11-04T12:00:00Z",
    nextCursor: null,
    nextTransitionAt: null,
    refreshAfterSeconds: 60,
  };
  return {
    view,
    updateView,
    period,
    updatePeriod,
    state,
    updateState,
    noDate,
    setNoDate,
    day,
    setDay,
    body,
    items,
    groups,
    page,
    counts: page.counts,
    selected: items.filter((item) => item.localDate === day),
  };
};

const baseId = "chat-dinner";
const contextKey = "somewhere-desktop-list-r1-context";
const readContext = () => {
  const defaults = {
    view: "list" as "list" | "calendar",
    period: "upcoming" as "upcoming" | "past",
    state: "ready",
    noDate: false,
    day: "2026-11-06",
    positions: { list: 0, calendar: 0 },
  };
  try {
    return {
      ...defaults,
      ...JSON.parse(sessionStorage.getItem(contextKey) ?? "{}"),
    } as typeof defaults;
  } catch {
    return defaults;
  }
};
