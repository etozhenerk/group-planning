import type { ReactNode } from "react";
import { InvitationDetails } from "@invite/pages/invite/ui/InvitationDetails";
import styles from "@invite/pages/invite/ui/InvitationContent/InvitationContent.module.css";

export type InvitationContentProps = {
  title: string;
  organizer: string;
  photo: string;
  scenario: string;
  closedNotice: ReactNode;
  actions: ReactNode;
};
export const InvitationContent = (props: InvitationContentProps) => (
  <main className={styles.content} data-cover={props.scenario !== "no-cover"}>
    {props.scenario !== "no-cover" && (
      <div className={styles.poster}>
        <img src="./dinner.png" alt="Пицца на столе в кафе" />
      </div>
    )}
    <InvitationDetails {...props} />
  </main>
);
