import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

export const useSettingsExit = (input: {
  active: boolean;
  dirty: boolean;
  blocked: boolean;
  reviewing: boolean;
  leaveReview: () => void;
  register: ((handler: (() => boolean) | null) => void) | undefined;
  discarded: ((navigating: boolean) => void) | undefined;
}) => {
  const { active, dirty, blocked, reviewing, leaveReview, register, discarded } = input;
  const [confirm, setConfirm] = useState(false);
  const blocker = useBlocker(active && (dirty || blocked || reviewing));
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
    if (blocker.state === 'blocked') {
      if (blocked) {
        blocker.reset();
      } else if (reviewing) {
        leaveReview();
        blocker.reset();
      }
    }
  }, [blocked, blocker, reviewing, leaveReview]);
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

      if (reviewing) {
        leaveReview();

        return false;
      }

      if (dirty) {
        setConfirm(true);

        return false;
      }

      return true;
    });

    return () => register?.(null);
  }, [active, blocked, confirm, dirty, reviewing, leaveReview, register]);

  return {
    confirm: active && !blocked && !reviewing && (confirm || blocker.state === 'blocked'),
    stay: () => {
      setConfirm(false);

      if (blocker.state === 'blocked') {
        blocker.reset();
      }
    },
    leave: () => {
      const navigating = blocker.state === 'blocked';
      discarded?.(navigating);

      if (blocker.state === 'blocked') {
        blocker.proceed();
      }
    },
  };
};
