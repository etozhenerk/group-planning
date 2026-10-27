import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { useChatRead } from '@/entities/meeting';

export const useReadVisibility = (
  ref: RefObject<HTMLDivElement | null>,
  read: ReturnType<typeof useChatRead>,
  covered: boolean,
) => {
  const current = useRef({ read, covered });
  current.current = { read, covered };
  useEffect(() => {
    const view = ref.current;

    if (!view || !read.enabled) {
      return;
    }

    let frame: number | undefined;
    const update = () => {
      const bounds = view.getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = Math.max(bounds.top, viewport?.offsetTop ?? 0);
      const bottom = Math.min(
        bounds.bottom,
        (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight),
      );

      const overlay =
        current.current.covered ||
        !!document.querySelector(
          'dialog[open]:not([role="main"]),[data-chat-overlay],[data-action-menu],[aria-label="Выбор эмодзи"],[role="dialog"]:not(dialog)',
        );

      const sequences = [
        ...view.querySelectorAll<HTMLElement>('[data-read-sequence]'),
      ].flatMap((row) => {
        const end = row.getBoundingClientRect();

        return end.bottom > top &&
          end.bottom <= bottom &&
          end.right > bounds.left &&
          end.left < bounds.right
          ? [row.dataset.readSequence!]
          : [];
      });

      current.current.read.setVisibility({
        sequences,
        active: document.visibilityState === 'visible' && document.hasFocus(),
        covered: overlay,
      });
    };

    const schedule = () => {
      update();

      if (frame === undefined) {
        frame = requestAnimationFrame(() => {
          frame = undefined;
          update();
        });
      }
    };

    const resize = new ResizeObserver(schedule);
    resize.observe(view);
    const observed = new Set<Element>();
    const observeRows = () => {
      for (const row of observed) {
        if (!view.contains(row)) {
          resize.unobserve(row);
          observed.delete(row);
        }
      }

      for (const row of view.querySelectorAll('[data-read-sequence]')) {
        if (!observed.has(row)) {
          resize.observe(row);
          observed.add(row);
        }
      }
    };

    const changes = new MutationObserver(() => {
      observeRows();
      schedule();
    });

    changes.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open', 'data-closing', 'data-motion'],
    });

    observeRows();

    view.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('focus', schedule);
    window.addEventListener('blur', update);
    document.addEventListener('visibilitychange', update);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    update();

    return () => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }

      resize.disconnect();
      changes.disconnect();
      view.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('focus', schedule);
      window.removeEventListener('blur', update);
      document.removeEventListener('visibilitychange', update);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      current.current.read.setVisibility({ sequences: [], active: false, covered: true });
    };
  }, [ref, read.enabled, covered]);
};
