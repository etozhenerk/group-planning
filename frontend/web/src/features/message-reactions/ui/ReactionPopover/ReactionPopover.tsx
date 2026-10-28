import { FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
import type { RefObject } from 'react';
import { ReactionChooser } from '@/features/message-reactions/ui/ReactionChooser';
import { useReactionPopover } from '@/features/message-reactions/ui/ReactionPopover/hooks/useReactionPopover';
import styles from '@/features/message-reactions/ui/ReactionPopover/ReactionPopover.module.css';

export type ReactionPopoverProps = {
  open: boolean;
  change: (value: boolean) => void;
  choose: (emoji: string) => void;
  pending: boolean;
  anchor: RefObject<HTMLElement | null>;
  boundary: RefObject<HTMLElement | null>;
  context: string;
  selected: string[];
  readers?: (() => void) | undefined;
};

export const ReactionPopover = ({
  open,
  change,
  choose,
  pending,
  anchor,
  boundary,
  context,
  selected,
  readers,
}: ReactionPopoverProps) => {
  const popover = useReactionPopover(open, change, anchor, boundary);

  return popover.transition.isMounted ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={popover.context}
        modal={false}
        initialFocus={0}
        getInsideElements={popover.inside}
        returnFocus={anchor}
      >
        <div
          ref={popover.setFloating}
          style={popover.floatingStyles}
          className={styles.panel}
          aria-label="Реакция"
          data-chat-overlay="reaction"
          data-closing={!open}
          {...popover.getFloatingProps()}
        >
          <div style={popover.transition.styles} className={styles.surface}>
            <ReactionChooser
              readers={readers}
              choose={choose}
              pending={pending}
              close={() => change(false)}
              selected={selected}
              context={context}
              resize={popover.resize}
            />
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  ) : null;
};
