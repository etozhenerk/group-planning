import { type Context } from "@prototype/pages/chat/model/context";
import { find } from "@prototype/shared/lib/dom";

export const installMenuMotion = (context: Context): void => {
  const menu = find("#add-menu");
  let active: Animation | undefined;

  context.setMenu = (open) => {
    if (context.state.menuOpen === open) return;
    context.state.menuOpen = open;
    const style = getComputedStyle(menu);
    const offset = `translateY(${style.getPropertyValue("--menu-offset").trim()})`;
    const from = {
      opacity: menu.hidden ? 0 : Number(style.opacity),
      transform: menu.hidden ? offset : style.transform,
    };
    active?.cancel();
    menu.hidden = false;
    menu.inert = !open;
    menu.setAttribute("aria-hidden", String(!open));
    find("#add-button").setAttribute("aria-expanded", String(open));

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      menu.hidden = !open;
      return;
    }

    const animation = menu.animate(
      [from, { opacity: open ? 1 : 0, transform: open ? "translateY(0)" : offset }],
      {
        duration: parseFloat(style.getPropertyValue(open ? "--menu-enter" : "--menu-exit")),
        easing: style.getPropertyValue("--menu-easing").trim(),
        fill: "forwards",
      },
    );
    active = animation;
    void animation.finished.then(
      () => {
        if (active !== animation) return;
        active = undefined;
        menu.hidden = !open;
        animation.cancel();
      },
      () => {},
    );
  };
};
