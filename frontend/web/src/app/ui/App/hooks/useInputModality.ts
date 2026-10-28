import { useEffect } from 'react';

export const useInputModality = () => {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset['inputModality'];
    root.dataset['inputModality'] = 'keyboard';
    const pointer = (event: PointerEvent) => {
      if (event.isTrusted) {
        root.dataset['inputModality'] = 'pointer';
      }
    };

    const keyboard = (event: KeyboardEvent) => {
      if (event.isTrusted && !['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)) {
        root.dataset['inputModality'] = 'keyboard';
      }
    };

    const virtualClick = (event: MouseEvent) => {
      if (event.isTrusted && event.detail === 0) {
        root.dataset['inputModality'] = 'keyboard';
      }
    };

    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('click', virtualClick, true);

    return () => {
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
