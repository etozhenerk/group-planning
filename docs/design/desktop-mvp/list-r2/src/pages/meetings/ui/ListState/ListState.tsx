import { CalendarPlus, CloudOff, RotateCw, ArrowRight } from "lucide-react";
import styles from "@list/pages/meetings/ui/ListState/ListState.module.css";

export type ListStateProps = {
  error?: boolean;
  past?: boolean;
  undated?: boolean;
  retry: () => void;
  showUpcoming: () => void;
};

export const ListState = ({
  error = false,
  past = false,
  undated = false,
  retry,
  showUpcoming,
}: ListStateProps) => (
  <section className={styles.state} role={error ? "alert" : undefined}>
    <div className={styles.icon}>
      {error ? (
        <CloudOff size={34} strokeWidth={1.5} />
      ) : (
        <CalendarPlus size={34} strokeWidth={1.5} />
      )}
    </div>
    <h2>
      {error
        ? "Не удалось загрузить встречи"
        : undated
          ? "Встреч без даты нет"
          : past
            ? "Нет прошедших встреч"
            : "Нет предстоящих встреч"}
    </h2>
    {!error && (
      <p>
        {past
          ? "Перейдите к предстоящим, чтобы посмотреть ближайшие планы."
          : undated
            ? "Встречи с выбранной датой доступны в общем списке."
            : "Создайте встречу и отправьте приглашение друзьям."}
      </p>
    )}
    {error ? (
      <button type="button" onClick={retry}>
        <RotateCw size={17} />
        Повторить загрузку
      </button>
    ) : past || undated ? (
      <button type="button" onClick={showUpcoming}>
        К предстоящим встречам
        <ArrowRight size={17} />
      </button>
    ) : (
      <button type="button">
        <CalendarPlus size={17} />
        Создать встречу
      </button>
    )}
  </section>
);
