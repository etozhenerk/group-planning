import type { FeedEntry } from '@/entities/meeting';
import type { Session } from '@/entities/session';
export const session: Session = { user: { id: 'alice', displayName: 'Алиса' }, csrf: null, expiresAt: '2099-01-01T00:00:00Z' };
export const entries: FeedEntry[] = Array.from({ length: 500 }, (_, index) => ({
  id: `entry-${index}`, meetingId: 'meeting', sequence: String(index + 1), kind: 'message',
  actor: { id: 'alice', displayName: 'Алиса' }, occurredAt: '2026-10-27T12:00:00Z',
  clientRequestId: `intent-${index}`, text: `Сообщение ${index}: ` + 'Существующая карточка. '.repeat(index % 5 + 1), event: '', supported: true,
}));
