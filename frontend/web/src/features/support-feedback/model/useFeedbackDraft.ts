import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useSession } from '@/entities/session';
import type {
  FeedbackKind,
  FeedbackScreen,
  Screenshot,
} from '@/features/support-feedback/model/types';

type Content = {
  kind: FeedbackKind;
  screen: FeedbackScreen;
  description: string;
  email: string | null;
  screenshot: Screenshot | null;
  diagnostics: {
    client_version: string;
    platform: string;
    browser: string;
    viewport: { width: number; height: number };
  } | null;
};

type Draft = {
  kind: FeedbackKind;
  screen: FeedbackScreen;
  description: string;
  email: string;
  diagnostics: boolean;
  screenshot: Screenshot | null;
  pending: { key: string; content: Content } | null;
  receipt: { id: string; reference: string; status: 'accepted' } | null;
  error: Error | null;
  busy: boolean;
  scroll: { current: number };
};

export const useFeedbackDraft = (
  kind: FeedbackKind,
  screen: FeedbackScreen,
  mobile: boolean,
) => {
  const client = useQueryClient(),
    session = useSession(),
    local = useRef(crypto.randomUUID());

  const key = [
    'support-draft',
    mobile ? (session.data?.user.id ?? 'anonymous') : local.current,
  ];

  const empty = (): Draft => ({
    kind,
    screen,
    description: '',
    email: '',
    diagnostics: false,
    screenshot: null,
    pending: null,
    receipt: null,
    error: null,
    busy: false,
    scroll: { current: 0 },
  });

  const { data: value } = useQuery({
    queryKey: key,
    queryFn: empty,
    initialData: empty,
    enabled: false,
    gcTime: mobile ? Infinity : 0,
  });

  const patch = (update: Partial<Draft>) => {
    if (client.getQueryData(key)) {
      client.setQueryData<Draft>(key, (current) =>
        current ? { ...current, ...update } : current,
      );
    }
  };

  const edit = (update: Partial<Draft>) => {
    if (!value.pending && !value.busy) {
      patch({ ...update, error: null });
    }
  };

  const reset = () => {
    client.removeQueries({ queryKey: key, exact: true });
  };

  return { value, patch, edit, reset, scroll: value.scroll };
};
