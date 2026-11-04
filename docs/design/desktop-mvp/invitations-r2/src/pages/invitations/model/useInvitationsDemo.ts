import { navigateAfterReply } from "@rsvp/model/desktopRoutes";
import { saveReply, readReply, clearReplies } from "@rsvp/model/replies";
import { useEffect, useRef, useState } from "react";
import type { Answer } from "@/shared/api";
import type { SavedInvitation } from "@/entities/meeting";
import {
  invitations,
  moreInvitations,
} from "@inv/pages/invitations/model/data";

export const useInvitationsDemo = () => {
  const [state, setState] = useState(
    new URLSearchParams(location.search).get("state") ?? "ready",
  );
  const [selected, setSelected] = useState<SavedInvitation | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [pending, setPending] = useState<Answer | null>(null);
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState(6);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    failed = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  const changeState = (next: string) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    clearReplies();
    setState(next);
    setSelected(null);
    setAnswers({});
    setPending(null);
    setError(false);
    setLimit(6);
    failed.current = false;
  };
  const open = (item: SavedInvitation) => {
    setSelected(item);
    setError(false);
    failed.current = false;
  };
  const close = () => {
    if (pending) {
      return;
    }
    setSelected(null);
    setError(false);
  };
  const reply = (answer: Answer) => {
    if (!selected || pending) {
      return;
    }
    setPending(answer);
    setError(false);
    timer.current = setTimeout(() => {
      setPending(null);
      if (state === "answer-error" && !failed.current) {
        failed.current = true;
        setError(true);
        return;
      }
      const meta = selected.preview;
      const context = {
        id: meta.meetingId,
        title: meta.title,
        startsAt: meta.startsAt,
        startsOn: meta.startsOn ?? null,
        place: meta.place,
        coverUrl: meta.coverUrl,
      };
      if (answer !== "maybe") {
        navigateAfterReply(answer, context);
        return;
      }
      saveReply(answer, context);
      setAnswers((previous) => ({
        ...previous,
        [selected.preview.meetingId]: answer,
      }));
      setSelected(null);
    }, 480);
  };
  const source =
    state === "empty"
      ? []
      : state === "many"
        ? [...invitations, ...moreInvitations].slice(0, limit)
        : invitations;
  const items = source
    .filter(
      (item) =>
        !readReply(item.preview.meetingId) ||
        readReply(item.preview.meetingId)?.answer === "maybe",
    )
    .map((item) => {
      const record = readReply(item.preview.meetingId);
      return record
        ? { ...item, preview: { ...item.preview, title: record.title } }
        : item;
    })
    .filter(
      (item) =>
        !answers[item.preview.meetingId] ||
        answers[item.preview.meetingId] === "maybe",
    )
    .map((item, index) =>
      state === "long" && index === 0
        ? {
            ...item,
            preview: {
              ...item.preview,
              title: "Большой вечер настольных игр, пиццы и разговоров до утра",
              place:
                "Кафе «Соседи», второй этаж у окна, большой стол у дальней стены",
              organizer: {
                id: "lena",
                displayName: "Александра Константинопольская",
              },
            },
          }
        : item,
    );
  return {
    state,
    changeState,
    selected,
    open,
    close,
    pending,
    error,
    reply,
    items,
    hasMore: state === "many" && limit < 9,
    more: () => setLimit((value) => value + 3),
  };
};
