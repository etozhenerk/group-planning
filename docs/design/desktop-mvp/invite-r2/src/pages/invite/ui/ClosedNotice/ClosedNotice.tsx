import { LockKeyhole } from "lucide-react";
import type { Answer } from "@invite/pages/invite/model/types";
import styles from "@invite/pages/invite/ui/ClosedNotice/ClosedNotice.module.css";

export type ClosedNoticeProps = { last: Answer | null };
export const ClosedNotice = ({ last }: ClosedNoticeProps) => {
  const labels = { going: "Приду", maybe: "Возможно", not_going: "Не смогу" };
  return (
    <div className={styles.closed} role="status">
      <span className={styles.icon}>
        <LockKeyhole size={19} strokeWidth={1.7} />
      </span>
      <div>
        <strong>Участие закрыто</strong>
        <p>
          {last
            ? `Вы ответили «${labels[last]}».`
            : "Новых участников больше не принимают."}
        </p>
      </div>
    </div>
  );
};
