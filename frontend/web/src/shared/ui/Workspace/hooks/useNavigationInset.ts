import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

export const useNavigationInset = (
  workspace: RefObject<HTMLDivElement | null>,
  slot: RefObject<HTMLDivElement | null>,
) => {
  useLayoutEffect(() => {
    const root = workspace.current;
    const navigation = slot.current?.firstElementChild;

    if (!root || !(navigation instanceof HTMLElement)) {
      return;
    }

    const update = () => {
      const style = getComputedStyle(navigation);
      const height =
        style.position === 'fixed' && style.display !== 'none'
          ? navigation.getBoundingClientRect().height
          : 0;

      root.style.setProperty('--mobile-navigation-height', `${height}px`);
    };

    const observer = new ResizeObserver(update);
    observer.observe(navigation);
    window.addEventListener('resize', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty('--mobile-navigation-height');
    };
  }, [workspace, slot]);
};
