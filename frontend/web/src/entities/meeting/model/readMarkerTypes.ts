import type { ChatReadMarker } from '@/entities/meeting/model/chatReadSchema';

export type ReadVisibility = {
  sequences: readonly string[];
  active: boolean;
  covered: boolean;
};

export type ReadMarkerOptions = {
  send: (
    sequence: string,
    signal: AbortSignal,
    keepalive: boolean,
  ) => Promise<ChatReadMarker>;
  onConfirmed: (result: ChatReadMarker) => void;
  onError?: (error: unknown) => void;
  initialSequence?: string;
  now?: () => number;
};
