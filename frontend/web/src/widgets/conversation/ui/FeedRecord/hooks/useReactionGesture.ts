import { useRef } from 'react';
import { useHoldGesture } from '@/shared/lib/hold-gesture';

export const useReactionGesture = (enabled: boolean, open: () => void) => {
  const anchor = useRef<HTMLDivElement>(null);
  const gesture = useHoldGesture<HTMLDivElement>(enabled, open, true);

  return { anchor, ...gesture };
};
