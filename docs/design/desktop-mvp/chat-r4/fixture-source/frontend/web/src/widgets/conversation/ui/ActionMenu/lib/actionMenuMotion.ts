import { designTokens } from '@/shared/config/design-tokens';

export const animateActionMenu = (
  menu: HTMLDivElement,
  open: boolean,
  reduced: boolean,
  complete: () => void,
) => {
  const current = getComputedStyle(menu);
  const away = `translateY(${designTokens.spaceS8})`;
  const transform = menu.style.transform || (open ? away : current.transform);
  const opacity = menu.style.opacity || (open ? '0' : current.opacity);
  menu.style.removeProperty('transform');
  menu.style.removeProperty('opacity');
  menu.dataset['motion'] = open ? 'opening' : 'closing';

  if (reduced) {
    menu.dataset['motion'] = open ? 'open' : 'closed';
    complete();

    return;
  }

  let cancelled = false;
  const animation = menu.animate(
    [
      { transform, opacity },
      { transform: open ? 'translateY(0)' : away, opacity: open ? 1 : 0 },
    ],
    {
      duration: Number.parseFloat(
        open ? designTokens.motionDurationMobileSheet : designTokens.motionDurationFast,
      ),
      easing: designTokens.motionEasingStandard,
      fill: 'both',
    },
  );

  void animation.finished
    .then(() => {
      if (cancelled) {
        return;
      }

      menu.dataset['motion'] = open ? 'open' : 'closed';

      if (!open) {
        menu.style.opacity = '0';
        menu.style.transform = away;
      }

      animation.cancel();
      complete();
    })
    .catch(() => undefined);

  return () => {
    cancelled = true;
    const snapshot = getComputedStyle(menu);
    menu.style.opacity = snapshot.opacity;
    menu.style.transform = snapshot.transform;
    animation.cancel();
  };
};
