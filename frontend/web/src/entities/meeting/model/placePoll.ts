import type { WirePlacePoll } from '@/shared/api';

export type PlacePoll = {
  id: string;
  meetingId: string;
  place: string;
  explanation: string | null;
  previousPlace: string | null;
  state: WirePlacePoll['state'];
  revision: string;
  myVoteRevision: string;
  myVote: PlaceVote | null;
  votesFor: number;
  votesAgainst: number;
  closesAt: string;
  canVote: boolean;
};

export type PlaceVote = 'for' | 'against';

export type PlaceVoteInput = { answer: PlaceVote; revision: string };

export type PlacePollCreate = { place: string; closesAt: string; explanation?: string };
