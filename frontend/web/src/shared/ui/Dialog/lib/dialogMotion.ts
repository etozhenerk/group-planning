import { designTokens } from '@/shared/config/design-tokens';

export const reducedDialogMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const animateDialog = (
  dialog: HTMLDialogElement,
  opening: boolean,
  complete: () => void,
) => {
  const sheet = dialog.dataset['mobile'] === 'true';
  const chatAction = dialog.dataset['chatAction'] === 'true';
  const rest = 'translateY(0)';
  const away = sheet ? 'translateY(100%)' : 'translateY(12px) scale(0.98)';
  const current = getComputedStyle(dialog).transform;
  dialog.dataset['motion'] = opening ? 'opening' : 'closing';
  const animation = dialog.animate(
    opening
      ? [
          { transform: away, opacity: sheet ? 1 : 0 },
          { transform: rest, opacity: 1 },
        ]
      : [
          { transform: current, opacity: 1 },
          { transform: away, opacity: sheet ? 1 : 0 },
        ],
    {
      duration: reducedDialogMotion()
        ? 0
        : chatAction
          ? Number.parseFloat(
              sheet
                ? designTokens.motionDurationMobileSheet
                : opening
                  ? designTokens.motionDurationNavigation
                  : designTokens.motionDurationFast,
            )
          : opening
            ? 280
            : 220,
      easing: chatAction
        ? designTokens.motionEasingStandard
        : opening
          ? 'cubic-bezier(0.22, 1, 0.36, 1)'
          : 'cubic-bezier(0.4, 0, 1, 1)',
      fill: 'both',
    },
  );

  void animation.finished
    .then(() => {
      complete();
      animation.cancel();
    })
    .catch(() => undefined);

  return () => animation.cancel();
};
