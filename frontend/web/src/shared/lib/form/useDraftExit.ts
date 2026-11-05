import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

export type DraftExitRegistration = (handler: (() => boolean) | null) => void;

export const useDraftExit = (input: {
  active: boolean;
  dirty: boolean;
  blocked: boolean;
  register: DraftExitRegistration | undefined;
  discard: () => void;
}) => {
  const { active, dirty, blocked, register, discard } = input;
  const [confirm, setConfirm] = useState(false);
  const blocker = useBlocker(active && (dirty || blocked));
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (active && (dirty || blocked)) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [active, dirty, blocked],
    ),
  );
  useEffect(() => {
    if (blocked && blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocked, blocker]);
  useLayoutEffect(() => {
    if (!active) {
      register?.(null);

      return;
    }

    register?.(() => {
      if (blocked) {
        return false;
      }

      if (confirm) {
        setConfirm(false);

        return false;
      }

      if (dirty) {
        setConfirm(true);

        return false;
      }

      return true;
    });

    return () => register?.(null);
  }, [active, dirty, blocked, confirm, register]);

  return {
    confirm: active && !blocked && (confirm || blocker.state === 'blocked'),
    stay: () => {
      setConfirm(false);

      if (blocker.state === 'blocked') {
        blocker.reset();
      }
    },
    leave: () => {
      discard();

      if (blocker.state === 'blocked') {
        blocker.proceed();
      }
    },
  };
};
