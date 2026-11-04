import { offset, flip, shift } from "@floating-ui/react";
import { useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Popup } from "@gravity-ui/uikit";
import { DateCalendar } from "@/shared/ui/DateCalendar";
import {
  calendarValue,
  calendarToday,
} from "@future/shared/ui/DateField/lib/calendarValue";
import { FieldMessage } from "@future/shared/ui/FieldMessage";
import styles from "@future/shared/ui/DateField/DateField.module.css";

export type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
};
export const DateField = ({
  value,
  onChange,
  error = "",
  disabled,
}: DateFieldProps) => {
  const id = useId(),
    anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        Дата <span aria-hidden="true">*</span>
      </label>
      <button
        ref={anchor}
        id={id}
        type="button"
        disabled={disabled}
        aria-label="Дата"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={`${id}-message`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        data-empty={!value}
      >
        <span>
          {value ? value.split("-").reverse().join(".") : "ДД.ММ.ГГГГ"}
        </span>
        <CalendarDays size={18} strokeWidth={1.7} aria-hidden="true" />
      </button>
      <FieldMessage id={`${id}-message`} error={error} />
      <Popup
        anchorRef={anchor}
        open={open}
        onOpenChange={setOpen}
        placement="bottom-start"
        floatingMiddlewares={[
          offset(6),
          flip({
            fallbackPlacements: ["top-start", "right-start", "left-start"],
            padding: 12,
          }),
          shift({ padding: 12, crossAxis: true }),
        ]}
        returnFocus={anchor}
        modal
        role="dialog"
        className={styles.popup ?? ""}
      >
        <DateCalendar
          label="Дата встречи"
          value={calendarValue(value)}
          today={calendarToday("Europe/Moscow") ?? null}
          clearable={!!value}
          change={(date) => onChange(date?.format("YYYY-MM-DD") ?? "")}
          close={() => setOpen(false)}
        />
      </Popup>
    </div>
  );
};
