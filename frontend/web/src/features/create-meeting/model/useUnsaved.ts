import { useCallback } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

export const useUnsaved = (dirty: boolean) => {
  const blocker = useBlocker(dirty);
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [dirty],
    ),
  );

  return {
    blocked: blocker.state === 'blocked',
    stay: () => {
      if (blocker.state === 'blocked') {
        blocker.reset();
      }
    },
    leave: () => {
      if (blocker.state === 'blocked') {
        blocker.proceed();
      }
    },
  };
};
