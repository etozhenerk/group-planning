import { useEffect, useState } from 'react';

export const useReadersReady = (open: boolean) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) {
      setReady(false);

      return;
    }

    const update = () =>
      setReady(!document.querySelector('[data-chat-overlay="reaction"]'));

    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    update();

    return () => observer.disconnect();
  }, [open]);

  return open && ready;
};
