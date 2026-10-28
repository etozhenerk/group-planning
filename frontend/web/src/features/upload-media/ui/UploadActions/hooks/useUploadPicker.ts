import { useEffect, useRef } from 'react';

export const useUploadPicker = () => {
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = input.current;
    const restoreFocus = () => button.current?.focus({ preventScroll: true });
    element?.addEventListener('cancel', restoreFocus);

    return () => element?.removeEventListener('cancel', restoreFocus);
  }, []);

  return { input, button };
};
