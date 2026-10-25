import { useRef } from 'react';

export const useEmojiInsertion = (text: string, change: (value: string) => void) => {
  const input = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const remember = () => {
    if (input.current) {
      selection.current = {
        start: input.current.selectionStart,
        end: input.current.selectionEnd,
      };
    }
  };

  const insert = (emoji: string) => {
    const { start, end } = selection.current;
    const value = text.slice(0, start) + emoji + text.slice(end);

    if (value.length > 4000) {
      return;
    }

    change(value);
    selection.current = { start: start + emoji.length, end: start + emoji.length };
    requestAnimationFrame(() => {
      input.current?.focus({ preventScroll: true });
      input.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  return { input, remember, insert };
};
