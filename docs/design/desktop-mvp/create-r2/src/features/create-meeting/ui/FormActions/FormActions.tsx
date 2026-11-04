import { LoaderCircle, TriangleAlert, CircleHelp } from "lucide-react";
import styles from "@create/features/create-meeting/ui/FormActions/FormActions.module.css";

export type FormActionsProps = {
  sticky: boolean;
  problem: string;
  pending: boolean;
  preparing: boolean;
};
export const FormActions = ({
  sticky,
  problem,
  pending,
  preparing,
}: FormActionsProps) => (
  <footer className={styles.actions} data-sticky={sticky}>
    <div className={styles.inner}>
      <div className={styles.status} role={problem ? "alert" : "status"}>
        {problem && (
          <>
            <span className={styles.icon}>
              {problem === "uncertain" ? (
                <CircleHelp size={20} strokeWidth={1.7} />
              ) : (
                <TriangleAlert size={20} strokeWidth={1.7} />
              )}
            </span>
            <div>
              <strong>
                {problem === "uncertain"
                  ? "Не удалось подтвердить создание"
                  : "Не удалось создать встречу"}
              </strong>
              <p>
                {problem === "uncertain"
                  ? "Повторите отправку — данные менять не нужно."
                  : "Введённые данные остались в форме."}
              </p>
            </div>
          </>
        )}
      </div>
      <button
        className={styles.primary}
        type="submit"
        disabled={pending || preparing}
        aria-busy={pending || preparing}
      >
        <span data-hidden={pending || preparing}>
          {problem === "uncertain" ? "Повторить отправку" : "Создать встречу"}
        </span>
        {(pending || preparing) && (
          <LoaderCircle
            size={20}
            strokeWidth={1.8}
            className={styles.spinner}
            aria-label={preparing ? "Подготавливаем фото" : "Создаём встречу"}
          />
        )}
      </button>
    </div>
  </footer>
);
