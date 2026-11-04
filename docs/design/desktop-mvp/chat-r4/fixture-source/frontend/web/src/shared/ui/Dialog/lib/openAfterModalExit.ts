export const openAfterModalExit = (
  dialog: HTMLDialogElement,
  open: () => (() => void) | undefined,
) => {
  let disposeAnimation: (() => void) | undefined;
  let opened = false;
  const attempt = () => {
    if (
      opened ||
      [...document.querySelectorAll('dialog:modal')].some((other) => other !== dialog)
    ) {
      return;
    }

    opened = true;
    document.removeEventListener('close', attempt, true);
    disposeAnimation = open();
  };

  document.addEventListener('close', attempt, true);
  attempt();

  return () => {
    opened = true;
    document.removeEventListener('close', attempt, true);
    disposeAnimation?.();
  };
};
