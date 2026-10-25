import { FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
import { Smile } from 'lucide-react';
import { ReactionChooser } from '@/features/message-reactions/ui/ReactionChooser';
import { useReactionPopover } from '@/features/message-reactions/ui/ReactionPopover/hooks/useReactionPopover';
import styles from '@/features/message-reactions/ui/ReactionPopover/ReactionPopover.module.css';

export type ReactionPopoverProps = {
  open: boolean;
  change: (value: boolean) => void;
  choose: (emoji: string) => void;
  pending: boolean;
  people?: () => void;
};

export const ReactionPopover = ({
  open,
  change,
  choose,
  pending,
  people,
}: ReactionPopoverProps) => {
  const popover = useReactionPopover(open, change);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        ref={(element) => popover.refs.setReference(element)}
        aria-label="Добавить реакцию"
        aria-expanded={open}
        onClick={() => change(!open)}
        {...popover.getReferenceProps()}
      >
        <Smile size={20} />
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={popover.context} modal={false}>
            <div
              ref={(element) => popover.refs.setFloating(element)}
              style={popover.floatingStyles}
              className={styles.panel}
              aria-label="Реакция"
              {...popover.getFloatingProps()}
            >
              <ReactionChooser
                choose={choose}
                pending={pending}
                close={() => change(false)}
              />
              {people && (
                <button type="button" className={styles.people} onClick={people}>
                  Кто отреагировал
                </button>
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
};
