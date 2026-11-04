import { ArrowRight, LoaderCircle, CircleAlert } from "lucide-react";
import styles from "@invite/features/sign-in/ui/SignInAction/SignInAction.module.css";

export type SignInActionProps = {
  pending: boolean;
  error: boolean;
  cancelled: boolean;
  onStart: () => void;
};
export const SignInAction = ({
  pending,
  error,
  cancelled,
  onStart,
}: SignInActionProps) => (
  <section className={styles.action} aria-label="Вход для ответа">
    <button
      type="button"
      className={styles.primary}
      onClick={onStart}
      disabled={pending}
      aria-busy={pending}
      aria-label="Войти через Яндекс ID"
      aria-describedby="auth-status"
    >
      <span data-busy={pending}>
        Войти через Яндекс ID
        <ArrowRight size={18} strokeWidth={1.7} />
      </span>
      {pending && (
        <LoaderCircle size={20} className={styles.spinner} aria-hidden="true" />
      )}
    </button>
    <div
      id="auth-status"
      className={styles.status}
      role={error ? "alert" : "status"}
    >
      {error ? (
        <>
          <CircleAlert size={17} strokeWidth={1.7} />
          <span>Не удалось открыть вход. Попробуйте ещё раз.</span>
        </>
      ) : pending ? (
        "Открываем вход…"
      ) : cancelled ? (
        "Вход не завершён. Можно попробовать снова."
      ) : (
        "Вход не подтверждает участие."
      )}
    </div>
  </section>
);
