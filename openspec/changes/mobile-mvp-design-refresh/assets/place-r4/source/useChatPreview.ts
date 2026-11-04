import { useEffect, useRef, useState } from "react";
import type {
  PlacePoll,
  PlaceVoteInput,
  PlacePollCreate,
} from "@/entities/meeting";
import { ApiError } from "@/shared/api";
import { useChatPreview as useChatBase } from "@preview/useChatBase";
import { meeting, placeSeed, message, user, baseEntries } from "@preview/data";
import { formModes } from "@preview/pollFixtures";
export const useChatPreview = () => {
  const base = useChatBase();
  const [mapOpen, setMapOpen] = useState(["map","map-error"].includes(base.scenario)),
    [location, setLocation] = useState<
      import("@preview/placeLocations").PlaceLocation | null
    >(null);
  const fixture = (mode: string): PlacePoll => ({
    ...placeSeed,
    place: "Пиццерия на Маросейке, 12",
    explanation: "Там есть большой стол и можно заказать пиццу на всех.",
    state:
      mode === "applied"
        ? "applied"
        : mode === "cancelled"
          ? "cancelled"
          : ["tie", "empty-votes", "rejected"].includes(mode)
            ? "rejected"
            : "open",
    canVote: ![
      "applied",
      "cancelled",
      "tie",
      "empty-votes",
      "rejected",
    ].includes(mode),
    votesFor:
      mode === "empty-votes"
        ? 0
        : mode === "tie"
          ? 2
          : mode === "applied"
            ? 4
            : 2,
    votesAgainst:
      mode === "empty-votes"
        ? 0
        : mode === "tie"
          ? 2
          : mode === "rejected"
            ? 3
            : 1,
  });
  const [placePoll, setPlacePoll] = useState(() => fixture(base.scenario)),
    [details, setDetails] = useState(() => ({
      ...meeting,
      place:
        base.scenario === "applied"
          ? "Пиццерия на Маросейке, 12"
          : meeting.place,
    })),
    [show, setShow] = useState(!formModes.has(base.scenario)),
    [created, setCreated] = useState(false),
    [formGuard, setFormGuard] = useState(false),
    [voting, setVoting] = useState(false),
    [voteError, setVoteError] = useState<Error | null>(null),
    [lastVote, setLastVote] = useState<PlaceVoteInput | undefined>();
  const lock = useRef(false),
    timer = useRef<number | undefined>(),
    failed = useRef(false);
  useEffect(() => {
    window.clearTimeout(timer.current);
    lock.current = false;
    failed.current = false;
    setPlacePoll(fixture(base.scenario));
    setDetails({
      ...meeting,
      place:
        base.scenario === "applied"
          ? "Пиццерия на Маросейке, 12"
          : base.scenario === "cancelled"
            ? "Бар на Чистых прудах"
            : meeting.place,
    });
    setShow(!formModes.has(base.scenario));
    setCreated(false);
    setMapOpen(["map","map-error"].includes(base.scenario));
    setLocation(null);
    setFormGuard(false);
    setVoting(false);
    setVoteError(null);
    setLastVote(undefined);
  }, [base.scenario]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const votePlace = (input: PlaceVoteInput) => {
    if (lock.current || !placePoll.canVote) return;
    lock.current = true;
    setVoting(true);
    setVoteError(null);
    setLastVote(input);
    timer.current = window.setTimeout(() => {
      lock.current = false;
      setVoting(false);
      if (
        ["vote-error", "conflict"].includes(base.scenario) &&
        !failed.current
      ) {
        failed.current = true;
        setVoteError(
          base.scenario === "conflict"
            ? new ApiError(409, "place_vote_revision_conflict")
            : new Error("vote failed"),
        );
        return;
      }
      setPlacePoll((previous) => ({
        ...previous,
        myVote: input.answer,
        myVoteRevision: String(Number(previous.myVoteRevision) + 1),
        votesFor:
          previous.votesFor -
          (previous.myVote === "for" ? 1 : 0) +
          (input.answer === "for" ? 1 : 0),
        votesAgainst:
          previous.votesAgainst -
          (previous.myVote === "against" ? 1 : 0) +
          (input.answer === "against" ? 1 : 0),
      }));
    }, 400);
  };
  const addPlace = (input: PlacePollCreate) => {
    if (show) return false;
    setPlacePoll({
      ...fixture("poll"),
      ...input,
      previousPlace: details.place,
      votesFor: 0,
      votesAgainst: 0,
      myVote: null,
      myVoteRevision: "0",
    });
    setShow(true);
    setCreated(true);
    return true;
  };
  const finish = () => {
    if (placePoll.state !== "open") return;
    const accepted = placePoll.votesFor > placePoll.votesAgainst;
    setPlacePoll((previous) => ({
      ...previous,
      state: accepted ? "applied" : "rejected",
      canVote: false,
    }));
    if (accepted)
      setDetails((previous) => ({ ...previous, place: placePoll.place }));
  };
  useEffect(() => {
    window.addEventListener("place-preview-finish", finish);
    return () => window.removeEventListener("place-preview-finish", finish);
  }, [placePoll]);
  const entries = [
    ...baseEntries.slice(0, 3),
    message(
      "place-chat",
      "sasha",
      "А давайте в пиццерию? Там стол побольше.",
      14,
    ),
    ...(show
      ? [
          {
            ...message(
              "place-preview-entry",
              created ? "misha" : "sasha",
              "",
              16,
            ),
            text: null,
            placePollId: placePoll.id,
          },
        ]
      : []),
    ...(show && placePoll.state !== "open"
      ? [
          {
            ...message("place-result", "lena", "", 18),
            kind: "event",
            text: null,
            event:
              placePoll.state === "applied"
                ? "Место встречи изменено: " + placePoll.place + "."
                : placePoll.state === "cancelled"
                  ? "Организатор изменил место. Опрос отменён."
                  : "Новое место не выбрали. Встречаемся там, где договорились.",
          },
        ]
      : []),
  ];
  return {
    ...base,
    mapOpen,
    setMapOpen,
    location,
    setLocation,
    placePoll,
    details,
    session: user,
    entries,
    show,
    created,
    formGuard,
    setFormGuard,
    voting,
    voteError,
    lastVote,
    votePlace,
    addPlace,
  };
};
