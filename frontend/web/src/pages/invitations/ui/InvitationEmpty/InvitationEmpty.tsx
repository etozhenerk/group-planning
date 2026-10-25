import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import styles from '@/pages/invitations/ui/InvitationEmpty/InvitationEmpty.module.css';

export type InvitationEmptyProps = Record<string, never>;

export const InvitationEmpty = () => (
  <div className={styles.empty}>
    <Mail size={21} />
    <h2>Пока ничего нет</h2>
    <Link to="/meetings">К моим встречам</Link>
  </div>
);
