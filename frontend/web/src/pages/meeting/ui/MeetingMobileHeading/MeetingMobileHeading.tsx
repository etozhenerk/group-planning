import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/pages/meeting/ui/MeetingMobileHeading/MeetingMobileHeading.module.css';

export type MeetingMobileHeadingProps = {
  title: string;
  description: string;
  narrow: boolean;
  show: (opener: HTMLButtonElement) => void;
};

export const MeetingMobileHeading = ({
  title,
  description,
  narrow,
  show,
}: MeetingMobileHeadingProps) => (
  <>
    <span className={styles.mark} data-narrow={narrow} aria-hidden="true">
      <ChatIcon name="calendar" />
    </span>
    <button
      type="button"
      className={styles.heading}
      data-narrow={narrow}
      onClick={(event) => show(event.currentTarget)}
      aria-label={`Сведения о встрече «${title}»`}
      data-chat-surface-trigger
    >
      <span className={styles.title} role="heading" aria-level={1}>
        {title}
      </span>
      <span className={styles.description}>{description}</span>
    </button>
  </>
);
