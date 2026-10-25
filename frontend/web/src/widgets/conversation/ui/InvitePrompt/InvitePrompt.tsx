import { Mail } from 'lucide-react';
import { ShareInvitation } from '@/features/share-invitation';
import styles from '@/widgets/conversation/ui/InvitePrompt/InvitePrompt.module.css';

export type InvitePromptProps = { id: string };

export const InvitePrompt = ({ id }: InvitePromptProps) => (
  <div className={styles.prompt}>
    <span className={styles.icon}>
      <Mail size={21} />
    </span>
    <h2>Позовём остальных?</h2>
    <p>
      Отправьте друзьям ссылку на встречу.
      <br />
      После ответа «Приду» они появятся в чате.
    </p>
    <ShareInvitation id={id} />
  </div>
);
