import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useSignIn } from '@/features/sign-in';
import { designTokens } from '@/shared/config/design-tokens';
import { onboardingSlides } from '@/widgets/onboarding/model/onboardingSlides';

export const useOnboarding = () => {
  const [params, setParams] = useSearchParams();
  const action = useSignIn({ kind: 'home' });
  const last = onboardingSlides.length - 1;
  const [restored] = useState(() => {
    try {
      return Number(sessionStorage.getItem('somewhere.onboarding.page') ?? 0);
    } catch {
      return 0;
    }
  });

  const candidate = params.has('auth_error')
    ? last
    : Number(params.get('intro') ?? restored);

  const incoming = Number.isInteger(candidate)
    ? Math.max(0, Math.min(last, candidate))
    : 0;

  const [page, setPage] = useState(incoming);
  const requested = useRef<number | null>(null);

  useEffect(() => {
    if (requested.current !== null && incoming !== requested.current) {
      return;
    }

    requested.current = null;
    setPage(incoming);
  }, [incoming]);

  useEffect(() => {
    const restore = () => {
      requested.current = null;
      const value = Number(new URLSearchParams(window.location.search).get('intro') ?? 0);
      setPage(Number.isInteger(value) ? Math.max(0, Math.min(last, value)) : 0);
    };

    window.addEventListener('popstate', restore);

    return () => window.removeEventListener('popstate', restore);
  }, [last]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0);
  const busy = action.isBusy;
  const choose = (next: number) => {
    if (busy) {
      return;
    }

    const value = Math.max(0, Math.min(last, next));
    requested.current = value;
    setPage(value);
    const search = new URLSearchParams(params);
    search.delete('auth_error');
    search.set('intro', String(value));
    setParams(search, { flushSync: true });
  };

  useEffect(() => {
    try {
      sessionStorage.setItem('somewhere.onboarding.page', String(page));
    } catch {
      /* Storage can be unavailable in a private browser. */
    }
  }, [page]);

  return {
    page,
    last,
    busy,
    choose,
    error: action.error,
    drag,
    signIn: () => action.mutate(),
    pointerDown: (x: number, y: number) => {
      if (!busy) {
        pointer.current = { x, y };
      }
    },
    pointerMove: (x: number, y: number, width: number) => {
      const start = pointer.current;

      if (!start || busy) {
        return;
      }

      const dx = x - start.x;
      const dy = y - start.y;

      if (Math.abs(dy) > Math.abs(dx)) {
        pointer.current = null;
        setDrag(0);

        return;
      }

      const allowed = (page > 0 || dx < 0) && (page < last || dx > 0);
      setDrag(allowed ? Math.max(-width, Math.min(width, dx)) : 0);
    },
    pointerCancel: () => {
      pointer.current = null;
      setDrag(0);
    },
    pointerUp: (x: number, y: number) => {
      const start = pointer.current;
      pointer.current = null;
      setDrag(0);

      if (!start || busy) {
        return;
      }

      const dx = x - start.x;

      if (
        Math.abs(dx) >
          Number.parseFloat(designTokens.componentMobileOnboardingSwipeCommitDistance) &&
        Math.abs(y - start.y) <
          Number.parseFloat(
            designTokens.componentMobileOnboardingSwipeMaximumVerticalDistance,
          )
      ) {
        choose(page + (dx < 0 ? 1 : -1));
      }
    },
  };
};
