import styles from '@/widgets/conversation/ui/UnreadDivider/UnreadDivider.module.css';

export type UnreadDividerProps = Record<string, never>;

export const UnreadDivider = () => <div className={styles.divider}>Непрочитанные</div>;
