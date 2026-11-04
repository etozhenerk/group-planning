import { flip, offset, shift } from '@floating-ui/react';
import type { DefaultPropsMap } from '@gravity-ui/uikit';

export const popupDefaults: DefaultPropsMap = {
  Popup: {
    disablePortal: false,
    strategy: 'fixed',
    floatingMiddlewares: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8, crossAxis: true }),
    ],
  },
};
