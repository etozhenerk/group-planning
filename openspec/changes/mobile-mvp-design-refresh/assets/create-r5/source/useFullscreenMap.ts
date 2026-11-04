import { useLayoutEffect, useRef } from "react";
export const useFullscreenMap = () => {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const dialog = root.current?.closest("dialog");
    if (!dialog) return;
    dialog.dataset.mapPicker = "true";
    dialog.dataset.motion="open";
    dialog.getAnimations().forEach((animation) => animation.cancel());
    dialog.style.removeProperty("transform");
    return () => {
      delete dialog.dataset.mapPicker;
      dialog.style.removeProperty("transform");
    };
  }, []);
  return root;
};
