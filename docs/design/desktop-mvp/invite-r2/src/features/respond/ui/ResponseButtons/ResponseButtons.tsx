import { LoaderCircle } from "lucide-react";
import type { Answer } from "@invite/features/respond/model/types";
import styles from "@invite/features/respond/ui/ResponseButtons/ResponseButtons.module.css";

export type ResponseButtonsProps = {
  answer: Answer | null;
  pending: Answer | null;
  disabled: boolean;
  onReply: (answer: Answer) => void;
};
export const ResponseButtons = ({
  answer,
  pending,
  disabled,
  onReply,
}: ResponseButtonsProps) => (
  <div className={styles.choices}>
    {(
      [
        ["going", "Приду"],
        ["maybe", "Возможно"],
        ["not_going", "Не смогу"],
      ] as const
    ).map(([value, label]) => (
      <button
        type="button"
        key={value}
        aria-pressed={answer === value}
        aria-label={label}
        aria-describedby="response-status"
        data-primary={value === "going"}
        data-busy={pending === value}
        disabled={disabled || !!pending}
        aria-busy={pending === value}
        onClick={() => onReply(value)}
      >
        <span>{label}</span>
        {pending === value && (
          <LoaderCircle
            className={styles.spinner}
            size={18}
            aria-hidden="true"
          />
        )}
      </button>
    ))}
  </div>
);
