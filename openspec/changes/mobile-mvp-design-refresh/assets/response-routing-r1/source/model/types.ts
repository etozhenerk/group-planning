export type Answer = 'going' | 'maybe' | 'not_going';
export type ReplyContext = { id: string; title: string; startsAt?: string | null; startsOn?: string | null; place?: string | null; coverUrl?: string | null };
export type ReplyRecord = ReplyContext & { answer: Answer };
