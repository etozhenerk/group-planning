import { ChevronLeft, Info, Share2 } from "lucide-react";
import { meeting, user } from "@preview/data";
import styles from "@desktop/pages/chat/ui/ChatHeader/ChatHeader.module.css";

export type ChatHeaderProps = {
  onInfo: () => void;
  onShare: () => void;
  infoOpen: boolean;
};

export const ChatHeader = ({ onInfo, onShare, infoOpen }: ChatHeaderProps) => (
  <header className={styles.header}>
    <button className={styles.back} type="button" aria-label="К моим встречам">
      <ChevronLeft size={24} strokeWidth={1.7} />
    </button>
    <img className={styles.cover} src="./dinner.png" alt="" />
    <div className={styles.title}>
      <h1>{meeting.title}</h1>
      <p>6 ноября · 20:00 · 6 участников</p>
    </div>
    {meeting.organizerId === user.user.id && (
      <button
        className={styles.icon}
        type="button"
        aria-label="Поделиться приглашением"
        onClick={onShare}
      >
        <Share2 size={20} strokeWidth={1.7} />
      </button>
    )}
    <button
      className={styles.icon}
      type="button"
      aria-label="Информация о встрече"
      aria-expanded={infoOpen}
      onClick={onInfo}
    >
      <Info size={21} strokeWidth={1.7} />
    </button>
  </header>
);
