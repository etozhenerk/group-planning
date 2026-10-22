export type PollSettings = {
  multipleAnswers: boolean;
  allowRevoting: boolean;
  allowNewOptions: boolean;
  anonymous: boolean;
  hideResults: boolean;
};

export type PollOption = {
  id: string;
  date: string;
  votes: number | null;
  voters: { id: string; displayName: string }[] | null;
};

export type DatePoll = {
  id: string;
  meetingId: string;
  author: { id: string; displayName: string };
  settings: PollSettings;
  options: PollOption[];
  state:
    | 'open'
    | 'awaiting_choice'
    | 'awaiting_time'
    | 'applied'
    | 'no_majority'
    | 'cancelled';
  revision: string;
  myVoteRevision: string;
  myOptionIds: string[];
  createdAt: string;
  closesAt: string;
  closedAt: string | null;
  leaderOptionIds: string[];
  appliedOptionId: string | null;
  canVote: boolean;
  canAddOptions: boolean;
  canResolve: boolean;
};

export type PollCreate = { dates: string[]; closesAt: string; settings: PollSettings };

export type PollAction =
  | { kind: 'vote'; optionIds: string[]; revision: string }
  | { kind: 'options'; date: string; revision: string }
  | { kind: 'resolve'; optionId: string; revision: string; startsAt?: string | null };
