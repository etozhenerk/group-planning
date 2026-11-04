import { useEffect, useRef } from "react";
import { X, ArrowRight, LoaderCircle, CircleAlert } from "lucide-react";
import styles from "@prototype/features/demo-signin/ui/LoginDialog/LoginDialog.module.css";

export type LoginDialogProps = {
  open: boolean;
  state: "ready" | "busy" | "error" | "cancelled";
  onClose: () => void;
  onStart: () => void;
};

export const LoginDialog = ({
  open,
  state,
  onClose,
  onStart,
}: LoginDialogProps) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      primary.current?.focus({ preventScroll: true });
    }
    if (!open && dialog.current?.open) {
      dialog.current?.close();
    }
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="signin-title"
      aria-describedby="signin-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            onClose();
          }
        }
      }}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Закрыть вход"
      >
        <X size={20} />
      </button>
      <img
        className={styles.mark}
        src="./somewhere-mark.svg"
        alt=""
        width="56"
        height="56"
      />
      <h2 id="signin-title">Войти в somewhere</h2>
      <p id="signin-description" className={styles.description}>
        Отдельная регистрация не нужна.
      </p>
      <button
        className={styles.button}
        ref={primary}
        type="button"
        onClick={onStart}
        disabled={state === "busy"}
        aria-busy={state === "busy"}
        aria-label="Войти через Яндекс ID"
        aria-describedby="signin-status"
      >
        <span className={styles.label} data-busy={state === "busy"}>
          Войти через Яндекс ID
          <ArrowRight size={19} />
        </span>
        {state === "busy" && (
          <LoaderCircle className={styles.spinner} size={22} />
        )}
      </button>
      <div
        className={styles.status}
        id="signin-status"
        role={state === "error" ? "alert" : "status"}
        data-error={state === "error"}
      >
        {state === "error" ? (
          <>
            <CircleAlert size={17} />
            <span>
              Не удалось открыть вход.
              <br />
              Попробуйте ещё раз.
            </span>
          </>
        ) : state === "busy" ? (
          "Открываем вход…"
        ) : state === "cancelled" ? (
          "Вход не завершён. Можно попробовать снова."
        ) : (
          "После входа откроются ваши встречи."
        )}
      </div>
    </dialog>
  );
};
