import { desktopDestination, navigateAfterReply } from "@rsvp/model/desktopRoutes";
import { clearReplies } from "@rsvp/model/replies";
import { useEffect, useRef, useState } from "react";
import type { Answer } from "@invite/pages/invite/model/types";

export const useInvitationDemo = () => {
  const params = new URLSearchParams(location.search);
  const initial = new URLSearchParams(location.search).get("state") ?? "guest";
  const [scenario, setScenario] = useState(initial);
  const [signedIn, setSignedIn] = useState(
    !["guest", "auth-error", "auth-cancelled"].includes(initial),
  );
  const [answer, setAnswer] = useState<Answer | null>(
    ["member", "closed-member"].includes(initial)
      ? "going"
      : ["maybe", "response-error", "response-unknown"].includes(initial)
        ? "maybe"
        : null,
  );
  const [pending, setPending] = useState<Answer | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState(initial === "auth-error");
  const [responseError, setResponseError] = useState(
    initial === "response-error",
  );
  const [uncertain, setUncertain] = useState(initial === "response-unknown");
  const [last, setLast] = useState<Answer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lock = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  const title =
    scenario === "long"
      ? "Большой вечер настольных игр, пиццы и разговоров до утра"
      : params.get("title") || "Ужин в пятницу";
  const context = {
    id: params.get("meeting") || "chat-dinner",
    title,
    startsAt: scenario === "no-time" ? null : "2026-11-06T17:00:00Z",
    startsOn: "2026-11-06",
    place: scenario === "no-place" ? null : "Кафе «Соседи», Покровка, 8",
    coverUrl: scenario === "no-cover" ? null : "/dinner",
  };
  useEffect(() => {
    if (["member", "closed-member", "organizer"].includes(scenario)) {
      location.replace(desktopDestination("going", context));
    }
  }, [scenario]);
  const changeState = (state: string) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    lock.current = false;
    clearReplies();
    setScenario(state);
    setSignedIn(!["guest", "auth-error", "auth-cancelled"].includes(state));
    setAnswer(
      ["member", "closed-member"].includes(state)
        ? "going"
        : ["maybe", "response-error", "response-unknown"].includes(state)
          ? "maybe"
          : null,
    );
    setPending(null);
    setAuthPending(false);
    setAuthError(state === "auth-error");
    setResponseError(state === "response-error");
    setUncertain(state === "response-unknown");
    setLast(null);
  };
  const signIn = () => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setAuthPending(true);
    setAuthError(false);
    timer.current = setTimeout(() => {
      lock.current = false;
      setAuthPending(false);
      setSignedIn(true);
    }, 800);
  };
  const respond = (next: Answer) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setPending(next);
    setResponseError(false);
    timer.current = setTimeout(() => {
      lock.current = false;
      setPending(null);
      setAnswer(next);
      setLast(next);
      setUncertain(false);
      navigateAfterReply(next, context);
    }, 650);
  };
  const isClosed = scenario.startsWith("closed") && answer !== "going";
  return {
    scenario,
    changeState,
    signedIn,
    answer,
    pending,
    authPending,
    authError,
    responseError,
    uncertain,
    last,
    signIn,
    respond,
    isClosed,
    signOut: () => {
      setSignedIn(false);
      setLast(null);
      setAuthError(false);
    },
    title,
    organizer:
      scenario === "organizer"
        ? "Миша"
        : scenario === "long"
          ? "Александра Константинопольская"
          : "Лена",
    organizerPhoto: scenario === "organizer" ? "misha" : "lena",
  };
};
