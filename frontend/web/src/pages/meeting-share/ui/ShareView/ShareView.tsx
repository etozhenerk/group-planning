import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useEffect } from 'react';
import type { Session } from '@/entities/session';
import { ShareForm } from '@/features/share-invitation';
import { Workspace } from '@/shared/ui/Workspace';
import { Navigation } from '@/widgets/navigation';
import styles from '@/pages/meeting-share/ui/ShareView/ShareView.module.css';

export type ShareViewProps = { id: string; session: Session };

export const ShareView = ({ id, session }: ShareViewProps) => {
  const navigate = useNavigate();
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void navigate(`/meetings/${id}`, { replace: true });
      }
    };

    document.addEventListener('keydown', close);

    return () => document.removeEventListener('keydown', close);
  }, [id, navigate]);

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.page}>
        <Link className={styles.back} to={`/meetings/${id}`}>
          <ChevronLeft size={20} aria-hidden="true" />
          Встреча
        </Link>
        <h1>Пригласить друзей</h1>
        <ShareForm id={id} />
      </main>
    </Workspace>
  );
};
