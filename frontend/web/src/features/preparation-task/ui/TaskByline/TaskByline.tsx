import type { PreparationTask } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { clockLabel } from '@/shared/lib/time';
import styles from '@/features/preparation-task/ui/TaskByline/TaskByline.module.css';

export type TaskBylineProps = { author: PreparationTask['author']; occurredAt: string };

export const TaskByline = ({ author, occurredAt }: TaskBylineProps) => (
  <div className={styles.byline}>
    <Avatar name={author.displayName} src={author.avatarUrl} size="small" />
    <span>{author.displayName}</span>
    <time dateTime={occurredAt}>{clockLabel(occurredAt)}</time>
  </div>
);
