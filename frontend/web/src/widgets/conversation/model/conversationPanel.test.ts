import { describe, expect, it } from 'vitest';
import { isConversationPanel } from '@/widgets/conversation/model/conversationPanel';

describe('conversation panel history', () => {
  it('opens actions for an outgoing intent before a server entry exists', () => {
    expect(
      isConversationPanel('reaction:outbox:26a63d5d-1d37-4ef1-baf0-ce4498872ab9'),
    ).toBe(true);
    expect(isConversationPanel('reaction:server-entry')).toBe(true);
  });
  it('does not treat an outgoing key as a server readers or people entry', () => {
    expect(
      isConversationPanel('readers:outbox:26a63d5d-1d37-4ef1-baf0-ce4498872ab9'),
    ).toBe(false);
    expect(
      isConversationPanel('people:outbox:26a63d5d-1d37-4ef1-baf0-ce4498872ab9'),
    ).toBe(false);
    expect(isConversationPanel('reaction:outbox:')).toBe(false);
    expect(isConversationPanel('reaction:outbox:../../elsewhere')).toBe(false);
  });
});
