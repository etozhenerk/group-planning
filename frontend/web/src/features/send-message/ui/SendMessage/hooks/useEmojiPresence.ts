import { useLayoutEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/shared/lib/media';
import { animateEmojiPanel } from '@/features/send-message/ui/SendMessage/lib/emojiPanelMotion';

export const useEmojiPresence = (open: boolean, mobile: boolean, compact: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  const [retained, setRetained] = useState(open);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (open) {
      setRetained(true);
    }

    return animateEmojiPanel(element, open, mobile, reduced, () => setRetained(open));
  }, [open, mobile, compact, reduced]);

  return {
    visible: open || retained,
    props: { ref, inert: !open, 'aria-hidden': !open, 'data-emoji-panel': true },
  };
};
