import { useRef } from 'react';
import { usePanelHistory } from '@/shared/lib/panel-history';
import { useMobileLayout } from '@/shared/lib/media';

type ConversationPanel =
  'add' | 'emoji' | `reaction:${string}` | `people:${string}` | `readers:${string}`;

const isConversationPanel = (value: unknown): value is ConversationPanel =>
  typeof value === 'string' &&
  (value === 'add' ||
    value === 'emoji' ||
    /^(reaction|people|readers):[a-zA-Z0-9-]+$/.test(value));

export const useConversationSurface = (meeting: string, user: string) => {
  const history = usePanelHistory(`conversation:${user}:${meeting}`, isConversationPanel);
  const boundary = useRef<HTMLDivElement>(null);
  const mobile = useMobileLayout();
  const setPanel = (
    value:
      | ConversationPanel
      | null
      | ((previous: ConversationPanel | null) => ConversationPanel | null),
  ) => {
    const next = typeof value === 'function' ? value(history.panel) : value;

    if (next === null) {
      history.close();
    } else {
      history.show(next, history.panel !== null);
    }
  };

  return { panel: history.panel, setPanel, boundary, mobile };
};

export type ConversationSurface = ReturnType<typeof useConversationSurface>;
