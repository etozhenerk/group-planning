const dialogs = new Set<HTMLDialogElement>();
let saved = { root: '', body: '', padding: '' };

const preventBackgroundGesture = (event: Event) => {
  const dialog = [...dialogs].at(-1);

  if (dialog && event.target instanceof Node && !dialog.contains(event.target)) {
    event.preventDefault();
  }
};

export const lockBackgroundScroll = (dialog: HTMLDialogElement) => {
  if (dialogs.size === 0) {
    const root = document.documentElement;
    const body = document.body;
    saved = {
      root: root.style.overflow,
      body: body.style.overflow,
      padding: body.style.paddingRight,
    };
    const gutter = window.innerWidth - root.clientWidth;

    if (gutter > 0) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    }

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    document.addEventListener('wheel', preventBackgroundGesture, {
      passive: false,
      capture: true,
    });
    document.addEventListener('touchmove', preventBackgroundGesture, {
      passive: false,
      capture: true,
    });
  }

  dialogs.add(dialog);

  return () => {
    dialogs.delete(dialog);

    if (dialogs.size === 0) {
      document.documentElement.style.overflow = saved.root;
      document.body.style.overflow = saved.body;
      document.body.style.paddingRight = saved.padding;
      document.removeEventListener('wheel', preventBackgroundGesture, true);
      document.removeEventListener('touchmove', preventBackgroundGesture, true);
    }
  };
};
