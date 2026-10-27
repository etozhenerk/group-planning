import { useRef, useLayoutEffect } from 'react';
import {
  eraseComposerText,
  insertComposerText,
} from '@/features/send-message/lib/editComposerText';

export const useEmojiInsertion = (
  text: string,
  change: (value: string) => void,
  saved: { start: number; end: number },
  persist: (selection: { start: number; end: number }) => void,
) => {
  const input = useRef<HTMLTextAreaElement>(null);
  const selection = useRef(saved);
  useLayoutEffect(() => {
    if (document.activeElement !== input.current) {
      selection.current = saved;
      input.current?.setSelectionRange(saved.start, saved.end);
    }
  }, [saved]);
  const remember = () => {
    if (input.current) {
      selection.current = {
        start: input.current.selectionStart,
        end: input.current.selectionEnd,
      };
      persist(selection.current);
    }
  };

  const apply = (edit: ReturnType<typeof insertComposerText>) => {
    if (!edit) {
      return;
    }

    change(edit.text);
    selection.current = edit.selection;
    persist(edit.selection);
    requestAnimationFrame(() => {
      input.current?.setSelectionRange(edit.selection.start, edit.selection.end);
    });
  };

  const restore = () => {
    input.current?.focus({ preventScroll: true });
    input.current?.setSelectionRange(selection.current.start, selection.current.end);
  };

  return {
    input,
    remember,
    restore,
    insert: (value: string) => apply(insertComposerText(text, selection.current, value)),
    erase: () => apply(eraseComposerText(text, selection.current)),
  };
};
