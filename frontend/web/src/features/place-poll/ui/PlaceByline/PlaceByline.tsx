import { Avatar } from '@/shared/ui/Avatar';
import { clockLabel } from '@/shared/lib/time';
import styles from '@/features/place-poll/ui/PlaceByline/PlaceByline.module.css';

export type PlaceBylineProps = {
  author: string;
  avatar: string | null | undefined;
  occurredAt: string;
};

export const PlaceByline = ({ author, avatar, occurredAt }: PlaceBylineProps) => (
  <div className={styles.byline}>
    <Avatar name={author} src={avatar ?? null} size="small" />
    <span>{author}</span>
    <time dateTime={occurredAt}>{clockLabel(occurredAt)}</time>
  </div>
);
