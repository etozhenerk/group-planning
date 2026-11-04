import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Dialog } from "@/shared/ui/Dialog";
import styles from "@desktop/pages/chat/ui/ShareDialog/ShareDialog.module.css";

export type ShareDialogProps = { open: boolean; onClose: () => void };

export const ShareDialog = ({ open, onClose }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState(false);
  const link = new URL(
    "../invite-r3/frame.html?state=ready",
    window.location.href,
  ).href;
  return (
    <Dialog
      open={open}
      title="Пригласить на встречу"
      onClose={onClose}
      chatAction
    >
      <div className={styles.body}>
        <p>
          Отправьте ссылку друзьям. В приглашении они смогут выбрать свой ответ.
        </p>
        <label htmlFor="invite-link">Ссылка-приглашение</label>
        <input
          id="invite-link"
          value={link}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          type="button"
          onClick={() => {
            setError(false);
            void navigator.clipboard
              .writeText(link)
              .then(() => setCopied(true))
              .catch(() => setError(true));
          }}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}{" "}
          {copied ? "Скопировано" : "Скопировать ссылку"}
        </button>
        {error && (
          <p role="alert">
            Не удалось скопировать. Выделите ссылку и скопируйте её вручную.
          </p>
        )}
      </div>
    </Dialog>
  );
};
