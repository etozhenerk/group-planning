import { Dialog } from "@/shared/ui/Dialog";
import { useVibe } from "@preview/useVibe";
import { VibeContext } from "@preview/VibeContext";
import { AlbumHeader } from "@preview/ui/AlbumHeader";
import { AlbumGallery } from "@preview/ui/AlbumGallery";
import { UploadPanel } from "@preview/ui/UploadPanel";
import { PhotoViewer } from "@preview/ui/PhotoViewer";
import styles from "@preview/ui/VibePage/VibePage.module.css";
export const VibePage = () => {
  const model = useVibe();
  return (
    <VibeContext value={model}>
      <main className={styles.page}>
        <div className={styles.status} aria-hidden="true" />
        <AlbumHeader />
        <AlbumGallery />
      </main>
      {!model.denied && (
        <Dialog
          open={model.uploading}
          title="Добавить фото"
          chatAction
          formLayout
          onClose={() => {
            if (!model.upload.busy) model.setUploading(false);
          }}
        >
          <UploadPanel />
        </Dialog>
      )}
      {model.viewer !== null && !model.denied && <PhotoViewer />}
    </VibeContext>
  );
};
