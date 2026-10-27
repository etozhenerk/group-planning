import { useLayoutEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/shared/lib/media';
import { animateActionMenu } from '@/widgets/conversation/ui/ActionMenu/lib/actionMenuMotion';

export const useActionMenuPresence = (open: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  const [retained, setRetained] = useState(open);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  useLayoutEffect(() => {
    const menu = ref.current;

    if (!menu) {
      return;
    }

    if (open) {
      setRetained(true);
    }

    return animateActionMenu(menu, open, reduced, () => setRetained(open));
  }, [open, reduced]);

  return {
    visible: open || retained,
    props: { ref, inert: !open, 'aria-hidden': !open },
  };
};
