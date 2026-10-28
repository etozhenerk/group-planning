import { Link } from 'react-router';
import type { Session } from '@/entities/session';
import { Dialog } from '@/shared/ui/Dialog';
import { UploadDraft } from '@/features/upload-media';
import { Navigation } from '@/widgets/navigation';
import { Workspace } from '@/shared/ui/Workspace';
import { AlbumHeading } from '@/pages/memories/ui/AlbumHeading';
import { AlbumBody } from '@/pages/memories/ui/AlbumBody';
import { useMemoriesView } from '@/pages/memories/model/useMemoriesView';
import { PhotoViewer } from '@/features/view-media';
import styles from '@/pages/memories/ui/MemoriesView/MemoriesView.module.css';

export type MemoriesViewProps = { id: string; session: Session };

export const MemoriesView = ({ id, session }: MemoriesViewProps) => {
  const view = useMemoriesView(id, session.user.id);

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.page}>
        <Link
          className={styles.back}
          to={view.fromChat ? `/meetings/${id}` : '/meetings?view=list&period=past'}
        >
          {view.fromChat ? '← К встрече' : '‹ Прошедшие встречи'}
        </Link>
        <AlbumHeading
          meeting={view.meeting.data}
          upload={view.choose}
          disabled={view.query.access.denied}
        />
        <AlbumBody
          photos={view.photos}
          user={session.user.id}
          album={view.album}
          query={view.query}
          open={view.open}
        />
        {view.current && !view.query.access.denied && (
          <PhotoViewer
            media={view.current}
            index={view.photos.findIndex((photo) => photo.id === view.current?.id)}
            count={view.photos.length}
            change={view.change}
            user={session.user.id}
            close={view.close}
          />
        )}
      </main>
      <Dialog
        open={view.uploading}
        title="Добавить фото в альбом"
        onClose={view.close}
        chatAction
      >
        <UploadDraft
          id={id}
          session={session}
          photo
          purpose="memory"
          active={view.uploading}
          done={view.complete}
        />
      </Dialog>
    </Workspace>
  );
};
