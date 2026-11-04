import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Meeting } from "@/entities/meeting";
import { resolveTime } from "@/shared/lib/time";
import { useChatModel } from "@preview/ChatContext";
export const usePlaceForm = (
  meeting: Meeting,
  _session: unknown,
  done: () => void,
) => {
  const m = useChatModel();
  const [place, setPlace] = useState(
      ["empty-form", "validation"].includes(m.scenario)
        ? ""
        : "Пиццерия на Маросейке, 12",
    ),
    [explanation, setExplanation] = useState(
      "Там есть большой стол и можно заказать пиццу на всех.",
    ),
    [deadline, setDeadline] = useState("2026-11-05T21:00"),
    [choice, setChoice] = useState<"" | "earlier" | "later">(""),
    [errors, setErrors] = useState<Record<string, string>>(
      m.scenario === "validation" ? { place: "Укажите новое место" } : {},
    ),
    [pending, setPending] = useState(false),
    [problem, setProblem] = useState(
      m.scenario === "form-error"
        ? "error"
        : m.scenario === "uncertain"
          ? "uncertain"
          : m.scenario === "active"
            ? "Во встрече уже есть открытый опрос о месте."
            : "",
    );
  const initial = useRef(
      JSON.stringify({ place, explanation, deadline, choice, location:m.location }),
    ),
    timer = useRef<number | undefined>(),
    lock = useRef(false),
    uncertain = problem === "uncertain",
    locked = pending || uncertain;
  const dirty =
    initial.current !==
    JSON.stringify({ place, explanation, deadline, choice, location:m.location });
  const edit = (change: () => void) => {
    if (locked) return;
    change();
    setErrors({});
    setProblem("");
  };
  useEffect(() => {
    const close = () => {
      if (locked) return;
      if (m.mapOpen) {
        m.setMapOpen(false);
        return;
      }
      if (m.formGuard) m.setFormGuard(false);
      else if (dirty) m.setFormGuard(true);
      else done();
    };
    window.addEventListener("place-form-close", close);
    return () => window.removeEventListener("place-form-close", close);
  }, [dirty, locked, m.formGuard, m.mapOpen]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    const next: Record<string, string> = {};
    if (!place.trim()) next.place = "Укажите новое место";
    else if ([...place.trim()].length > 500)
      next.place = "Сократите место до 500 символов";
    else if (place.trim() === meeting.place)
      next.place = "Предложите другое место";
    if ([...explanation.trim()].length > 2000)
      next.explanation = "Сократите пояснение до 2000 символов";
    if (!deadline.split("T")[0]) next.date = "Выберите дату окончания";
    if (!deadline.split("T")[1]) next.time = "Укажите время окончания";
    let closesAt = "";
    if (!next.date && !next.time)
      try {
        closesAt = resolveTime(deadline, meeting.timezone, choice);
        if (Date.parse(closesAt) <= Date.now())
          next.date = "Опрос должен закончиться позже текущего времени";
      } catch (error) {
        const text = error instanceof Error ? error.message : "Проверьте время";
        next[text.includes("дважды") ? "ambiguous" : "time"] = text;
      }
    setErrors(next);
    if (Object.keys(next).length) return;
    if (m.scenario === "active") {
      setProblem("Во встрече уже есть открытый опрос о месте.");
      return;
    }
    lock.current = true;
    setPending(true);
    setProblem("");
    timer.current = window.setTimeout(() => {
      setPending(false);
      lock.current = false;
      if (
        m.addPlace({
          place: place.trim(),
          explanation: explanation.trim(),
          closesAt,
        })
      )
        done();
      else setProblem("Во встрече уже есть открытый опрос о месте.");
    }, 450);
  };
  return {
    location: m.location,
    chooseLocation: (
      location: import("@preview/placeLocations").PlaceLocation,
    ) =>
      edit(() => {
        m.setLocation(location);
        setPlace(location.name + ", " + location.address);
        m.setMapOpen(false);
      }),
    clearLocation: () => edit(() => m.setLocation(null)),
    place,
    explanation,
    deadline,
    choice,
    errors,
    pending,
    problem,
    uncertain,
    locked,
    submit,
    setPlace: (value: string) =>
      edit(() => {
        m.setLocation(null);
        setPlace(value);
      }),
    setExplanation: (value: string) => edit(() => setExplanation(value)),
    setDeadline: (value: string) =>
      edit(() => {
        setDeadline(value);
        setChoice("");
      }),
    setChoice: (value: "" | "earlier" | "later") =>
      edit(() => setChoice(value)),
    stay: () => m.setFormGuard(false),
    leave: () => {
      m.setFormGuard(false);
      done();
    },
  };
};
