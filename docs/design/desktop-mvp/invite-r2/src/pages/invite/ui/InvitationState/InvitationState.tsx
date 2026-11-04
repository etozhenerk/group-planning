import { Link2Off, CloudOff, RotateCw } from "lucide-react";
import styles from "@invite/pages/invite/ui/InvitationState/InvitationState.module.css";

export type InvitationStateProps = { unavailable: boolean; retry: () => void };
export const InvitationState = ({
  unavailable,
  retry,
}: InvitationStateProps) => (
  <main className={styles.state}>
    <div className={styles.icon}>
      {unavailable ? (
        <Link2Off size={32} strokeWidth={1.5} />
      ) : (
        <CloudOff size={32} strokeWidth={1.5} />
      )}
    </div>
    <h1>
      {unavailable
        ? "Приглашение недоступно"
        : "Не удалось загрузить приглашение"}
    </h1>
    {unavailable ? (
      <>
        <p>Попросите организатора прислать актуальную ссылку.</p>
        <a href="../desktop-entry-r5/preview.html">О somewhere</a>
      </>
    ) : (
      <button type="button" onClick={retry}>
        <RotateCw size={17} strokeWidth={1.7} />
        Повторить загрузку
      </button>
    )}
  </main>
);
