import { CoverPixels } from '@/entities/meeting/ui/CoverPixels';
import { ImageOff } from 'lucide-react';
import { useCoverImage } from '@/entities/meeting/model/useCoverImage';
import styles from '@/entities/meeting/ui/MeetingCover/MeetingCover.module.css';

export type MeetingCoverProps = {
  url: string;
  meeting: string;
  user?: string;
  thumbnail?: boolean;
  fill?: boolean;
};

export const MeetingCover = ({
  url,
  meeting,
  user = '',
  thumbnail = false,
  fill = false,
}: MeetingCoverProps) => {
  const image = useCoverImage(url, meeting, user);

  return (
    <div
      className={fill ? styles.fill : thumbnail ? styles.thumbnail : styles.cover}
      data-testid="meeting-cover"
      aria-busy={image.loading}
    >
      {image.src ? (
        <CoverPixels key={image.src} src={image.src} />
      ) : image.loading ? (
        <div className={styles.loading} role="status" aria-label="Загрузка фото" />
      ) : (
        <ImageOff aria-label="Фото недоступно" size={24} />
      )}
    </div>
  );
};
