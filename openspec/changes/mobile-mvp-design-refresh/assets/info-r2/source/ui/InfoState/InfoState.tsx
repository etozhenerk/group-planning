import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@preview/ui/InfoState/InfoState.module.css';
export type InfoStateProps = {
  title: string;
  text: string;
  label: string;
  action?: () => void;
  link?: string;
};
export const InfoState = ({ title, text, label, action, link }: InfoStateProps) => (
  <section className={styles.state}>
    <span className={styles.mark}>
      <ChatIcon name="calendar" size={28} />
    </span>
    <h2>{title}</h2>
    <p>{text}</p>
    {link ? (
      <a href={link}>
        {label}
        <ChatIcon name="right" size={18} />
      </a>
    ) : (
      <button onClick={action}>
        {label}
        <ChatIcon name="right" size={18} />
      </button>
    )}
  </section>
);
