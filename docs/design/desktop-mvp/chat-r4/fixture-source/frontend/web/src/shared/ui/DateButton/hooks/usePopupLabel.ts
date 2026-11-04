import { useCallback } from 'react';

export const usePopupLabel = (label: string) =>
  useCallback(
    (node: HTMLDivElement | null) => {
      // UIKit places the dialog role on its floating wrapper, outside labelable content.
      node?.setAttribute('aria-label', label);
    },
    [label],
  );
