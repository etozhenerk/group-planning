import styles from "@inv/pages/invitations/ui/InvitationsHeader/InvitationsHeader.module.css";

export type InvitationsHeaderProps = { count: number; unknown: boolean };

export const InvitationsHeader = ({
  count,
  unknown,
}: InvitationsHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.heading}>
      <h1>Приглашения</h1>
      <span
        className={styles.count}
        data-unknown={unknown}
        aria-hidden={unknown}
      >
        {count}
      </span>
    </div>
    <p>
      Здесь встречи, на которые вы ответили «Возможно».
      <br />
      Откройте приглашение, чтобы изменить ответ.
    </p>
  </header>
);
