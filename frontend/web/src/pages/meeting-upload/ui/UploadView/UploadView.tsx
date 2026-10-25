import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';
import type { Session } from '@/entities/session';
import { MediaUpload } from '@/features/upload-media';
import { Workspace } from '@/shared/ui/Workspace';
import { Status } from '@/shared/ui/Status';
import { Navigation } from '@/widgets/navigation';
import { useUploadView } from '@/pages/meeting-upload/model/useUploadView';
import styles from '@/pages/meeting-upload/ui/UploadView/UploadView.module.css';

export type UploadViewProps = { id: string; session: Session };

export const UploadView = ({ id, session }: UploadViewProps) => {
  const view = useUploadView(id, session.user.id);

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.page}>
        <Link className={styles.back} to={view.returnTo} onClick={view.clear}>
          <ChevronLeft size={20} aria-hidden="true" />
          Назад
        </Link>
        <h1>
          {view.purpose === 'memory'
            ? 'Добавить фото в альбом'
            : view.photo
              ? 'Отправить фото'
              : 'Отправить файл'}
        </h1>
        {view.denied ? (
          <Status title="Доступ к встрече закрыт" />
        ) : (
          <MediaUpload
            id={id}
            session={session}
            purpose={view.purpose}
            photo={view.photo}
            initialFiles={view.files}
            done={view.done}
          />
        )}
      </main>
    </Workspace>
  );
};
