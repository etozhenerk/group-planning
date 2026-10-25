const dialogs = new Set<HTMLDialogElement>();
let saved = {
  root: '',
  body: '',
  padding: '',
  position: '',
  top: '',
  left: '',
  width: '',
  x: 0,
  y: 0,
};

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
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      x: window.scrollX,
      y: window.scrollY,
    };
    const gutter = window.innerWidth - root.clientWidth;

    if (gutter > 0) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    }

    root.style.overflow = 'hidden';
    // Clip keeps sticky navigation tied to the viewport instead of the frozen body.
    body.style.overflow = 'clip';
    body.style.position = 'fixed';
    body.style.top = `${-saved.y}px`;
    body.style.left = `${-saved.x}px`;
    body.style.width = '100%';
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
      document.body.style.position = saved.position;
      document.body.style.top = saved.top;
      document.body.style.left = saved.left;
      document.body.style.width = saved.width;
      window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
      document.removeEventListener('wheel', preventBackgroundGesture, true);
      document.removeEventListener('touchmove', preventBackgroundGesture, true);
    }
  };
};
