import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useDismiss,
  useRole,
  useInteractions,
} from '@floating-ui/react';

export const useReactionPopover = (open: boolean, close: (value: boolean) => void) => {
  const floating = useFloating({
    open,
    onOpenChange: close,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: 'dialog' });
  const interactions = useInteractions([dismiss, role]);

  return { ...floating, ...interactions };
};
