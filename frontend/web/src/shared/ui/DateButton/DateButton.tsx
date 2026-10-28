import { dateButtonLabel } from '@/shared/ui/DateButton/lib/dateButtonLabel';
import { Calendar } from 'lucide-react';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { DateCalendar } from '@/shared/ui/DateCalendar';
import { useDateButtonControl } from '@/shared/ui/DateButton/hooks/useDateButtonControl';
import { Popup } from '@gravity-ui/uikit';
import type { DateTime } from '@gravity-ui/date-utils';
import styles from '@/shared/ui/DateButton/DateButton.module.css';

export type DateButtonProps = {
  id: string;
  mobileSheet?: boolean;
  label: string;
  value: DateTime | null;
  weekday: boolean;
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
  weekday,
  today,
  disabled,
  invalid,
  clearable,
  open,
  setOpen,
  change,
}: DateButtonProps) => {
  const control = useDateButtonControl(setOpen);

  return (
    <>
      <button
        ref={control.button}
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
        onKeyDown={control.keyDown}
        data-date={value?.format('DD.MM.YYYY') ?? ''}
      >
        {mobileSheet && <ChatIcon name="calendar" />}
        <span className={styles.value} id={`${id}-value`}>
          {dateButtonLabel(value, mobileSheet, weekday)}
        </span>
        {mobileSheet ? (
          <ChatIcon name="down" />
        ) : (
          <Calendar size={16} aria-hidden="true" />
        )}
      </button>
      {open && (
        <Popup
          open={open}
          anchorRef={control.button}
          onOpenChange={setOpen}
          placement={['bottom-start', 'top-start']}
          modal
          disableTransition
          returnFocus={control.button}
          onEscapeKeyDown={control.restoreFocus}
          floatingRef={control.popupLabel}
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
