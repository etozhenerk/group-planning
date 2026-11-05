import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

export type DraftExitRegistration = (handler: (() => boolean) | null) => void;

export const useDraftExit = (input: {
  active: boolean;
  dirty: boolean;
  blocked: boolean;
  nested?: boolean;
  leaveNested?: (() => void) | undefined;
  register: DraftExitRegistration | undefined;
  discard: (navigating: boolean) => void;
}) => {
  const {
    active,
    dirty,
    blocked,
    register,
    discard,
    nested = false,
    leaveNested,
  } = input;

  const [confirm, setConfirm] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const didDiscard = useRef(false);
  const blocker = useBlocker(active && !discarding && (dirty || blocked || nested));
  useEffect(() => {
    if (!discarding || didDiscard.current) {
      return;
    }

    didDiscard.current = true;
    const navigating = blocker.state === 'blocked';
    discard(navigating);

    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [discarding, blocker, discard]);
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (active && !discarding && (dirty || blocked)) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [active, discarding, dirty, blocked],
    ),
  );
  useEffect(() => {
    if ((blocked || nested) && blocker.state === 'blocked') {
      blocker.reset();

      if (!blocked && nested) {
        leaveNested?.();
      }
    }
  }, [blocked, nested, leaveNested, blocker]);
  useLayoutEffect(() => {
    if (!active) {
      register?.(null);

      return;
    }

    register?.(() => {
      if (blocked || discarding) {
        return false;
      }

      if (confirm) {
        setConfirm(false);

        return false;
      }

      if (nested) {
        leaveNested?.();

        return false;
      }

      if (dirty) {
        setConfirm(true);

        return false;
      }

      return true;
    });

    return () => register?.(null);
  }, [active, dirty, blocked, discarding, confirm, register, nested, leaveNested]);

  return {
    confirm:
      active &&
      !blocked &&
      !nested &&
      (confirm || blocker.state === 'blocked' || discarding),
    stay: () => {
      setConfirm(false);

      if (blocker.state === 'blocked') {
        blocker.reset();
      }
    },
    leave: () => setDiscarding(true),
  };
};
