import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { CreateMeetingForm } from '@/features/create-meeting';
import { Workspace } from '@/shared/ui/layout';

export type CreateViewProps = { session: Session };

export const CreateView = ({ session }: CreateViewProps) => {
  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className="page-content create-page">
        <Link className="back-link" to="/meetings">
          <ArrowLeft aria-hidden="true" size={18} />
          Мои встречи
        </Link>
        <h1>Создать встречу</h1>
        <CreateMeetingForm session={session} />
      </main>
    </Workspace>
  );
};
