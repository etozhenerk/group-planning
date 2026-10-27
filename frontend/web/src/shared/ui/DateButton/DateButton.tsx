import { dateButtonLabel } from '@/shared/ui/DateButton/lib/dateButtonLabel';
import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { DateCalendar } from '@/shared/ui/DateCalendar';
import { usePopupLabel } from '@/shared/ui/DateButton/hooks/usePopupLabel';
import { Popup } from '@gravity-ui/uikit';
import type { DateTime } from '@gravity-ui/date-utils';
import styles from '@/shared/ui/DateButton/DateButton.module.css';

export type DateButtonProps = {
  id: string;
  mobileSheet?: boolean;
  label: string;
  value: DateTime | null;
  today: DateTime | null;
  disabled: boolean;
  invalid: boolean;
  clearable: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  change: (date: DateTime | null) => void;
};

export const DateButton = ({
  id,
  mobileSheet = false,
  label,
  value,
  today,
  disabled,
  invalid,
  clearable,
  open,
  setOpen,
  change,
}: DateButtonProps) => {
  const button = useRef<HTMLButtonElement>(null);
  const popupLabel = usePopupLabel('Выбрать дату');

  return (
    <>
      <button
        ref={button}
        id={id}
        className={styles.button}
        data-sheet={mobileSheet}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={`${id}-value`}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        data-date={value?.format('DD.MM.YYYY') ?? ''}
      >
        <span id={`${id}-value`}>{dateButtonLabel(value, mobileSheet)}</span>
        {mobileSheet ? (
          <ChatIcon name="calendar" />
        ) : (
          <Calendar size={16} aria-hidden="true" />
        )}
      </button>
      {open && (
        <Popup
          open={open}
          anchorRef={button}
          onOpenChange={setOpen}
          placement={['bottom-start', 'top-start']}
          modal
          disableTransition
          returnFocus={button}
          onEscapeKeyDown={() =>
            requestAnimationFrame(() => button.current?.focus({ preventScroll: true }))
          }
          floatingRef={popupLabel}
          role="dialog"
          className={styles.popup ?? ''}
        >
          <DateCalendar
            label={label}
            value={value}
            today={today}
            clearable={clearable}
            change={change}
            close={() => setOpen(false)}
          />
        </Popup>
      )}
    </>
  );
};
