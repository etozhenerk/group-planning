import styles from '@/pages/meeting-create/ui/CreateView/CreateView.module.css';
import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { CreateMeetingForm } from '@/features/create-meeting';
import { Workspace } from '@/shared/ui/Workspace';

export type CreateViewProps = { session: Session };

export const CreateView = ({ session }: CreateViewProps) => {
  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles['page-content']}>
        <Link className={styles['back-link']} to="/meetings">
          <ChevronLeft aria-hidden="true" size={18} />
          Мои встречи
        </Link>
        <h1>Новая встреча</h1>
        <CreateMeetingForm session={session} />
      </main>
    </Workspace>
  );
};
