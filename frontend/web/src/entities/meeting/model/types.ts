import type { PreparedCover } from '@/entities/meeting/model/cover';
import type { Media } from '@/shared/api';
import type { Answer } from '@/shared/api';

export type MeetingSummary = {
  period?: 'upcoming' | 'past' | 'undated';
  id: string;
  title: string;
  startsAt: string | null;
  startsOn?: string | null;
  timezone: string;
  place: string | null;
  coverUrl: string | null;
  organizerId?: string;
  participantPreview?: {
    id: string;
    display_name: string;
    avatar_url?: string | null | undefined;
  }[];
  memoryPhotoCount?: number;
  memoryPreview?: Media[];
  participantCount: number;
  revision: string;
  myRsvp: Answer | null;
  myRsvpRevision: string;
};

export type Meeting = MeetingSummary & {
  organizerId: string;
  description: string | null;
  createdAt: string;
};

export type Invitation = {
  organizer?: { id: string; displayName: string };
  joinClosesAt?: string | null;
  canJoin?: boolean;
  joinDisabledReason?: string | null;
  meetingId: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  startsOn?: string | null;
  timezone: string;
  place: string | null;
  coverUrl: string | null;
  myRsvp: Answer | null;
  myRsvpRevision: string;
};

export type Participant = {
  user: { id: string; displayName: string };
  role: 'organizer' | 'guest';
  answer: Answer | null;
  revision: string;
};

export type ResponseState = {
  meetingId: string;
  answer: Answer;
  revision: string;
  canAccess: boolean;
  meetingRevision: string;
};

export type FeedEntry = {
  attachments?: Media[];
  id: string;
  meetingId: string;
  sequence: string;
  kind: string;
  actor: { id: string; displayName: string };
  occurredAt: string;
  clientRequestId: string | null;
  text: string | null;
  event: string;
  supported: boolean;
  sender?: { kind: 'user' | 'bot'; id: string; displayName: string };
  pollId?: string;
  placePollId?: string;
  taskId?: string;
};

export type FeedPage = {
  entries: FeedEntry[];
  hasMore: boolean;
  latestSequence: string;
  meetingRevision: string;
  participantCount: number;
  myRsvp: Answer | null;
  myRsvpRevision: string;
};

export type Conversation = FeedPage & { hasOlder: boolean };

export type MeetingDraft = {
  cover?: PreparedCover | null | undefined;
  title: string;
  description: string;
  localTime: string;
  timezone: string;
  place: string;
  timeChoice: 'earlier' | 'later' | '';
};

export type MeetingInput = {
  cover?: PreparedCover | null | undefined;
  title: string;
  description: string | null;
  starts_at: string | null;
  starts_on: string;
  timezone: string;
  place: string | null;
};
