import { designTokens } from '@/shared/config/design-tokens';

export const animateEmojiPanel = (
  panel: HTMLDivElement,
  open: boolean,
  mobile: boolean,
  reduced: boolean,
  complete: () => void,
) => {
  const current = getComputedStyle(panel);
  const opacity = panel.style.opacity || (open ? '0' : current.opacity);
  const height = panel.style.height || (open ? '0' : current.height);
  panel.style.removeProperty('height');
  panel.style.removeProperty('opacity');
  const targetHeight = getComputedStyle(panel).height;
  panel.dataset['motion'] = open ? 'opening' : 'closing';

  if (reduced) {
    panel.dataset['motion'] = open ? 'open' : 'closed';
    complete();

    return;
  }

  let cancelled = false;
  const animation = panel.animate(
    [
      { opacity, ...(mobile ? { height } : {}) },
      {
        opacity: open ? 1 : 0,
        ...(mobile ? { height: open ? targetHeight : '0' } : {}),
      },
    ],
    {
      duration: Number.parseFloat(
        open
          ? designTokens.motionDurationEmojiPanelEnter
          : designTokens.motionDurationEmojiPanelExit,
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

      panel.dataset['motion'] = open ? 'open' : 'closed';

      if (!open) {
        panel.style.opacity = '0';

        if (mobile) {
          panel.style.height = '0';
        }
      }

      animation.cancel();
      complete();
    })
    .catch(() => undefined);

  return () => {
    cancelled = true;
    const snapshot = getComputedStyle(panel);
    panel.style.opacity = snapshot.opacity;

    if (mobile) {
      panel.style.height = snapshot.height;
    }

    animation.cancel();
  };
};
