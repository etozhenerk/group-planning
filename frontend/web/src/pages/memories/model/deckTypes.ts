export type DeckPhase =
  'idle' | 'dragging' | 'returning' | 'exiting' | 'assembling' | 'handoff';

export type DeckState = {
  index: number;
  offset: number;
  vertical: number;
  phase: DeckPhase;
  recycledIndex: number | null;
  duration: number;
  grid: boolean;
};

export type DeckEnvironment = {
  reduced: () => boolean;
  viewport: () => number;
  frame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
};
