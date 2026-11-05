import { AlbumNavigation } from '@/pages/memories/ui/AlbumNavigation';
import { useMobileLayout } from '@/shared/lib/media';
import type { Session } from '@/entities/session';
import { Dialog } from '@/shared/ui/Dialog';
import { UploadDraft } from '@/features/upload-media';
import { Navigation } from '@/widgets/navigation';
import { Workspace } from '@/shared/ui/Workspace';
import { AlbumHeading } from '@/pages/memories/ui/AlbumHeading';
import { AlbumActions } from '@/pages/memories/ui/AlbumActions';
import { DownloadAlbumFeedback, useAlbumDownload } from '@/features/download-album';
import { AlbumBody } from '@/pages/memories/ui/AlbumBody';
import { useMemoriesView } from '@/pages/memories/model/useMemoriesView';
import { PhotoViewer } from '@/features/view-media';
import styles from '@/pages/memories/ui/MemoriesView/MemoriesView.module.css';

export type MemoriesViewProps = { id: string; session: Session };

export const MemoriesView = ({ id, session }: MemoriesViewProps) => {
  const view = useMemoriesView(id, session.user.id);
  const download = useAlbumDownload(id, session);
  const mobile = useMobileLayout();

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.page}>
        <AlbumNavigation id={id} view={view} />
        <AlbumHeading
          meeting={view.meeting.data}
          actions={
            (!mobile || !view.query.access.denied) && (
              <AlbumActions
                upload={view.choose}
                disabled={view.query.access.denied}
                canDownload={view.photos.length > 0 && !view.query.access.denied}
                download={download}
              />
            )
          }
        />
        <DownloadAlbumFeedback state={download.state} />
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
            photos={view.photos}
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
        formLayout
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
