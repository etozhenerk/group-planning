import type {
  Meeting,
  DatePoll,
  PlacePoll,
  PreparationTask,
} from "@/entities/meeting";
import type { Session } from "@/entities/session";

export const noop = () => undefined;
export const session: Session = {
  user: { id: "misha", displayName: "Миша" },
  expiresAt: "2027-01-01T00:00:00Z",
  csrf: null,
};
export const meeting: Meeting = {
  id: "demo-meeting",
  title: "Настолки у Саши",
  startsAt: "2026-11-07T16:00:00Z",
  startsOn: "2026-11-07",
  timezone: "Europe/Moscow",
  place: "У Саши дома",
  coverUrl: null,
  organizerId: "sasha",
  participantCount: 6,
  participantPreview: [
    { id: "sasha", display_name: "Саша", avatar_url: "./avatars/sasha.jpg" },
    { id: "lena", display_name: "Лена", avatar_url: "./avatars/lena.jpg" },
    { id: "misha", display_name: "Миша", avatar_url: "./avatars/misha.jpg" },
  ],
  revision: "1",
  myRsvp: "going",
  myRsvpRevision: "1",
  description: "Собираемся играть. Пиццу закажем к семи.",
  createdAt: "2026-11-01T12:00:00Z",
};
export const datePoll: DatePoll = {
  id: "date-poll",
  meetingId: meeting.id,
  author: { id: "lena", displayName: "Лена" },
  settings: {
    multipleAnswers: false,
    allowRevoting: true,
    allowNewOptions: false,
    anonymous: false,
    hideResults: false,
  },
  options: [
    { id: "sat", date: "2026-11-07", votes: 2, voters: [] },
    { id: "sun", date: "2026-11-08", votes: 4, voters: [] },
  ],
  state: "applied",
  revision: "2",
  myVoteRevision: "1",
  myOptionIds: ["sun"],
  createdAt: "2026-11-03T12:00:00Z",
  closesAt: "2026-11-04T17:00:00Z",
  closedAt: "2026-11-04T17:00:00Z",
  leaderOptionIds: ["sun"],
  appliedOptionId: "sun",
  canVote: false,
  canAddOptions: false,
  canResolve: false,
};
export const placePoll: PlacePoll = {
  id: "place-poll",
  meetingId: meeting.id,
  place: "У Саши дома",
  explanation: "У Саши большой стол для настолок.",
  previousPlace: "Кафе «Соседи»",
  state: "applied",
  revision: "2",
  myVoteRevision: "1",
  myVote: "for",
  votesFor: 4,
  votesAgainst: 1,
  closesAt: "2026-11-04T17:00:00Z",
  canVote: false,
};
export const person = {
  id: "misha",
  displayName: "Миша",
  avatarUrl: "./avatars/misha.jpg",
};
export const task: PreparationTask = {
  id: "task",
  meetingId: meeting.id,
  title: "Заказать пиццу",
  author: {
    ...person,
    id: "lena",
    displayName: "Лена",
    avatarUrl: "./avatars/lena.jpg",
  },
  recipient: person,
  assignee: person,
  updatedBy: person,
  state: "accepted",
  revision: "2",
  createdAt: "2026-11-03T12:00:00Z",
  canAccept: false,
  canDecline: false,
  canCancel: false,
  canComplete: false,
};
export const calendar = {
  meetings: [
    { ...meeting, localDate: "2026-11-07", period: "upcoming" as const },
  ],
  days: [{ date: "2026-11-07", count: 1 }],
  counts: { upcoming: 1, past: 0, undated: 0 },
  nextCursor: null,
  asOf: "2026-11-04T12:00:00Z",
  nextTransitionAt: null,
  refreshAfterSeconds: 60,
};
