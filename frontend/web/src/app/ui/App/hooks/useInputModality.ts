import { useEffect } from 'react';

export const useInputModality = () => {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset['inputModality'];
    root.dataset['inputModality'] = 'keyboard';
    let pointerLabelControl: HTMLElement | null = null;
    let labelTimer: number | undefined;
    const clearLabel = () => {
      window.clearTimeout(labelTimer);
      pointerLabelControl = null;
    };

    const pointer = (event: PointerEvent) => {
      if (event.isTrusted) {
        clearLabel();
        root.dataset['inputModality'] = 'pointer';
      }
    };

    const keyboard = (event: KeyboardEvent) => {
      if (event.isTrusted && !['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)) {
        clearLabel();
        root.dataset['inputModality'] = 'keyboard';
      }
    };

    const virtualClick = (event: MouseEvent) => {
      if (!event.isTrusted) {
        return;
      }

      if (event.detail > 0) {
        const target = event.target instanceof Element ? event.target : null;
        const control = target?.closest('label')?.control;

        if (
          control &&
          target &&
          !control.contains(target) &&
          root.dataset['inputModality'] === 'pointer'
        ) {
          clearLabel();
          pointerLabelControl = control;
          labelTimer = window.setTimeout(clearLabel, 0);
        }

        return;
      }

      // WebKit forwards a pointer click on a label as a trusted detail=0 control click.
      if (event.target === pointerLabelControl) {
        clearLabel();

        return;
      }

      root.dataset['inputModality'] = 'keyboard';
    };

    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('click', virtualClick, true);

    return () => {
      clearLabel();
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', keyboard, true);
      document.removeEventListener('click', virtualClick, true);

      if (previous === undefined) {
        delete root.dataset['inputModality'];
      } else {
        root.dataset['inputModality'] = previous;
      }
    };
  }, []);
};
