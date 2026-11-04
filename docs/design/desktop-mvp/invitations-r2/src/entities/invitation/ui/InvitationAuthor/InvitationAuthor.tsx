import { Avatar } from "@/shared/ui/Avatar";
import styles from "@inv/entities/invitation/ui/InvitationAuthor/InvitationAuthor.module.css";

export type InvitationAuthorProps = { name: string; photo: string | null };

export const InvitationAuthor = ({ name, photo }: InvitationAuthorProps) => (
  <span className={styles.author}>
    <Avatar name={name} src={photo} size="small" />
    <span>
      <small>Приглашает</small>
      <strong>{name}</strong>
    </span>
  </span>
);
