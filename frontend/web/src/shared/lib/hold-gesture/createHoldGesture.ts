export const createHoldGesture = (
  hold: () => void,
  pressed: (value: boolean) => void,
  duration: number,
  tolerance: number,
) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let origin = { x: 0, y: 0 };
  let consumed = false;

  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    pressed(false);
  };

  const activate = () => {
    cancel();

    if (!consumed) {
      consumed = true;
      hold();
    }
  };

  return {
    start: (x: number, y: number) => {
      cancel();
      consumed = false;
      origin = { x, y };
      pressed(true);
      timer = setTimeout(activate, duration);
    },
    move: (x: number, y: number) => {
      if (Math.hypot(x - origin.x, y - origin.y) > tolerance) {
        cancel();
      }
    },
    resetClick: () => {
      consumed = false;
    },
    consumeClick: () => {
      const value = consumed;
      consumed = false;

      return value;
    },
    activate,
    cancel,
  };
};
