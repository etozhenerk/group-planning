import styles from '@/features/edit-meeting/ui/DesktopSettingsFeedback/DesktopSettingsFeedback.module.css';

export type DesktopSettingsFeedbackProps = { problem: string };

export const DesktopSettingsFeedback = ({ problem }: DesktopSettingsFeedbackProps) => (
  <p role="alert" className={styles.error}>
    {problem}
  </p>
);
