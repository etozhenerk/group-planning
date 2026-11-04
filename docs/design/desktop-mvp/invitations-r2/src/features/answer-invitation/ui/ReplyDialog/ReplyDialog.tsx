import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { MeetingCover, cardLabels } from "@/entities/meeting";
import type { SavedInvitation } from "@/entities/meeting";
import type { Answer } from "@/shared/api";
import { InvitationAuthor } from "@inv/entities/invitation";
import { ReplyChoices } from "@inv/features/answer-invitation/ui/ReplyChoices/ReplyChoices";
import styles from "@inv/features/answer-invitation/ui/ReplyDialog/ReplyDialog.module.css";

export type ReplyDialogProps = {
  item: SavedInvitation | null;
  photo: string | null;
  pending: Answer | null;
  error: boolean;
  onClose: () => void;
  onReply: (answer: Answer) => void;
};

export const ReplyDialog = ({
  item,
  photo,
  pending,
  error,
  onClose,
  onReply,
}: ReplyDialogProps) => {
  const dialog = useRef<HTMLDialogElement>(null),
    choice = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (item && !dialog.current?.open) {
      dialog.current?.showModal();
      choice.current?.focus({ preventScroll: true });
    }
    if (!item && dialog.current?.open) {
      dialog.current?.close();
    }
  }, [item]);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="reply-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        disabled={!!pending}
        aria-label="Закрыть ответ"
      >
        <X size={20} />
      </button>
      <h2 id="reply-title">Изменить ответ</h2>
      {item && (
        <>
          <div className={styles.meeting}>
            {item.preview.coverUrl && (
              <div className={styles.cover}>
                <MeetingCover
                  url={item.preview.coverUrl}
                  meeting={item.preview.meetingId}
                  fill
                />
              </div>
            )}
            <div>
              <h3>{item.preview.title}</h3>
              <p>{cardLabels(item.preview).date}</p>
              <p>{item.preview.place || "Место пока не выбрано"}</p>
            </div>
          </div>
          <div className={styles.host}>
            <InvitationAuthor
              name={item.preview.organizer?.displayName ?? "Организатор"}
              photo={photo}
            />
            <span>Ваш ответ · Возможно</span>
          </div>
        </>
      )}
      <ReplyChoices pending={pending} choiceRef={choice} onReply={onReply} />
      <p
        id="reply-status"
        className={styles.status}
        role={error ? "alert" : "status"}
        data-error={error}
      >
        {error
          ? "Не удалось изменить ответ. Попробуйте ещё раз."
          : pending
            ? "Сохраняем ответ…"
            : "После ответа «Приду» откроется общий чат."}
      </p>
    </dialog>
  );
};
