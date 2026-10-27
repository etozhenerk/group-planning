import { z } from 'zod';
import { readPrivateScope, updatePrivateScope } from '@/shared/lib/private-store';
import type { PrivateScope } from '@/shared/lib/private-store';

const selection = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

export const intentSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  createdAt: z.string(),
  state: z.enum(['queued', 'sending', 'uncertain', 'rejected']),
});
const documentSchema = z.object({
  draft: z.object({ text: z.string(), selection, revision: z.string() }),
  intents: z.array(intentSchema),
});

export type MessageIntent = z.infer<typeof intentSchema>;

export type MessageDocument = z.infer<typeof documentSchema>;

export type MessageDraft = MessageDocument['draft'];

export const emptyMessageDocument = (): MessageDocument => ({
  draft: { text: '', selection: { start: 0, end: 0 }, revision: '' },
  intents: [],
});
const parse = (value: unknown) =>
  value === undefined ? emptyMessageDocument() : documentSchema.parse(value);

export const readMessageDocument = async (scope: PrivateScope) =>
  parse(await readPrivateScope(scope));

export const updateMessageDocument = (
  scope: PrivateScope,
  change: (current: MessageDocument) => MessageDocument,
) => updatePrivateScope(scope, (value) => change(parse(value)));

export const enqueueMessage = (
  scope: PrivateScope,
  intent: MessageIntent,
  draftRevision: string,
) =>
  updateMessageDocument(scope, (current) => ({
    intents: current.intents.some((item) => item.id === intent.id)
      ? current.intents
      : [...current.intents, intent],
    draft:
      current.draft.revision === draftRevision
        ? emptyMessageDocument().draft
        : current.draft,
  }));
