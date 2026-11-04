import type { ReactNode } from "react";
import { InvitationFacts } from "@invite/pages/invite/ui/InvitationFacts";
import styles from "@invite/pages/invite/ui/InvitationDetails/InvitationDetails.module.css";

export type InvitationDetailsProps = {
  title: string;
  organizer: string;
  photo: string;
  scenario: string;
  closedNotice: ReactNode;
  actions: ReactNode;
};
export const InvitationDetails = ({
  title,
  organizer,
  photo,
  scenario,
  closedNotice,
  actions,
}: InvitationDetailsProps) => (
  <section className={styles.details}>
    <p className={styles.eyebrow}>Приглашение на встречу</p>
    <h1>{title}</h1>
    <div className={styles.organizer}>
      <img src={`./avatars/${photo}.jpg`} alt="" />
      <p>
        Приглашает <strong>{organizer}</strong>
      </p>
    </div>
    {closedNotice && <div className={styles.closure}>{closedNotice}</div>}
    <InvitationFacts
      noTime={scenario === "no-time"}
      noPlace={scenario === "no-place"}
    />
    <div className={styles.description} aria-label="Описание встречи">
      <p>
        Соберёмся после работы: поужинаем и поболтаем. Столик на шестерых уже
        забронирован.
      </p>
      {scenario === "long" && (
        <>
          <p>
            Берите любимые настолки. Будем выбирать игру на месте — можно прийти
            и без своей.
          </p>
          <p>
            Если освободитесь позже, напишите Лене. Можно присоединиться к нам в
            течение вечера.
          </p>
          <p>
            Кафе находится во дворе. Вход со стороны Покровки, столик на втором
            этаже у окна.
          </p>
        </>
      )}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </section>
);
