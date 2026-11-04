import { useState } from "react";
import {
  datePoll,
  placePoll,
  meeting,
  task,
  noop,
} from "@prototype/pages/entry/model/fixtures";

export const query = (data: unknown) => ({
  data,
  isPending: false,
  isFetching: false,
  error: null,
  access: { denied: false, epoch: 0 },
  refetch: noop,
  key: [],
});
export const useMeeting = () => query(meeting);
export const useMeetings = useMeeting;
export const useInvitation = useMeeting;
export const useInvitationOrganizer = useMeeting;
export const useParticipants = useMeeting;
export const useDatePoll = () => query(datePoll);
export const usePlacePoll = () => query(placePoll);
export const usePreparationTask = () => query(task);
export const useCoverImage = () => ({ src: "./boardgame.png", loading: false });
export const useMediaImage = () => ({
  src: "./dinner.png",
  loading: false,
  error: null,
  retry: noop,
});
export const useChatSyncEnabled = () => true;
export const useTaskControls = () => ({
  actions: [],
  disabled: false,
  pending: undefined,
  problem: "",
  retryable: false,
  retry: noop,
  act: noop,
});
export const useRespond = () => {
  const [saved, setSaved] = useState<"going" | "maybe" | "not_going" | null>(
    null,
  );
  return {
    saved,
    mutation: {
      isPending: false,
      error: null,
      mutate: (answer: "going" | "maybe" | "not_going") => setSaved(answer),
    },
  };
};
