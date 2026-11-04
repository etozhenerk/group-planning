import type { RefObject } from "react";
import { LoaderCircle } from "lucide-react";
import type { Answer } from "@/shared/api";
import styles from "@inv/features/answer-invitation/ui/ReplyChoices/ReplyChoices.module.css";

export type ReplyChoicesProps = {
  pending: Answer | null;
  choiceRef: RefObject<HTMLButtonElement | null>;
  onReply: (answer: Answer) => void;
};

export const ReplyChoices = ({
  pending,
  choiceRef,
  onReply,
}: ReplyChoicesProps) => (
  <div className={styles.choices}>
    {(
      [
        ["going", "Приду"],
        ["maybe", "Возможно"],
        ["not_going", "Не смогу"],
      ] as const
    ).map(([answer, label]) => (
      <button
        type="button"
        key={answer}
        ref={answer === "maybe" ? choiceRef : undefined}
        aria-pressed={answer === "maybe"}
        data-primary={answer === "going"}
        data-busy={pending === answer}
        disabled={!!pending}
        aria-busy={pending === answer}
        aria-describedby="reply-status"
        onClick={() => onReply(answer)}
      >
        <span>{label}</span>
        {pending === answer && (
          <LoaderCircle
            size={19}
            className={styles.spinner}
            aria-hidden="true"
          />
        )}
      </button>
    ))}
  </div>
);
