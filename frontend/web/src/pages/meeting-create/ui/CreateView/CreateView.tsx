import styles from '@/pages/meeting-create/ui/CreateView/CreateView.module.css';
import { ChevronLeft } from 'lucide-react';
import { PageBack } from '@/shared/ui/PageBack';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { CreateMeetingForm } from '@/features/create-meeting';
import { Workspace } from '@/shared/ui/Workspace';

export type CreateViewProps = { session: Session };

export const CreateView = ({ session }: CreateViewProps) => {
  return (
    <Workspace navigation={<Navigation session={session} />} mobileBrand={false}>
      <main id="main" className={styles['page-content']}>
        <PageBack to="/meetings" label="Вернуться к встречам" variant="create">
          <ChevronLeft aria-hidden="true" size={18} />
          Мои встречи
        </PageBack>
        <h1>Новая встреча</h1>
        <CreateMeetingForm session={session} />
      </main>
    </Workspace>
  );
};
