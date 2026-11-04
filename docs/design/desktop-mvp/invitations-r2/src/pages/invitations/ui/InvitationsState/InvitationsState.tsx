import { Ticket, CloudOff, RotateCw, ArrowRight } from "lucide-react";
import styles from "@inv/pages/invitations/ui/InvitationsState/InvitationsState.module.css";

export type InvitationsStateProps = { error?: boolean; onRetry: () => void };

export const InvitationsState = ({
  error = false,
  onRetry,
}: InvitationsStateProps) => (
  <section className={styles.state} role={error ? "alert" : undefined}>
    <div className={styles.icon}>
      {error ? (
        <CloudOff size={34} strokeWidth={1.5} />
      ) : (
        <Ticket size={34} strokeWidth={1.5} />
      )}
    </div>
    <h2>
      {error ? "Не удалось загрузить приглашения" : "Приглашений пока нет"}
    </h2>
    {error ? (
      <button type="button" onClick={onRetry}>
        <RotateCw size={17} />
        Повторить загрузку
      </button>
    ) : (
      <a href="../desktop-list-r2/preview.html">
        К моим встречам
        <ArrowRight size={17} />
      </a>
    )}
  </section>
);
