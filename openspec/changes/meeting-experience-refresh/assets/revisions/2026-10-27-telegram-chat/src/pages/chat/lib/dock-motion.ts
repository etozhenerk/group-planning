export const installDockMotion = (
  dock: HTMLElement,
  preserveScroll: () => void,
): ((open: boolean) => void) => {
  let active: Animation | undefined;
  let frame = 0;

  return (open) => {
    const fromHeight = dock.hidden ? 0 : dock.getBoundingClientRect().height;
    const fromOpacity = dock.hidden ? 0 : Number(getComputedStyle(dock).opacity);
    active?.cancel();
    cancelAnimationFrame(frame);
    dock.style.minHeight = "";
    dock.hidden = false;
    const targetHeight = open ? dock.getBoundingClientRect().height : 0;

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dock.hidden = !open;
      preserveScroll();
      return;
    }

    dock.style.minHeight = "0";
    const styles = getComputedStyle(dock);
    const animation = dock.animate(
      [
        { height: `${fromHeight}px`, opacity: fromOpacity },
        { height: `${targetHeight}px`, opacity: open ? 1 : 0 },
      ],
      {
        duration: parseFloat(styles.getPropertyValue(open ? "--emoji-enter" : "--emoji-exit")),
        easing: styles.getPropertyValue("--emoji-easing").trim(),
        fill: "forwards",
      },
    );
    active = animation;

    const track = () => {
      preserveScroll();
      if (active === animation && animation.playState === "running") {
        frame = requestAnimationFrame(track);
      }
    };
    frame = requestAnimationFrame(track);
    void animation.finished.then(
      () => {
        if (active !== animation) return;
        active = undefined;
        dock.hidden = !open;
        animation.cancel();
        dock.style.minHeight = "";
        preserveScroll();
      },
      () => {},
    );
  };
};
