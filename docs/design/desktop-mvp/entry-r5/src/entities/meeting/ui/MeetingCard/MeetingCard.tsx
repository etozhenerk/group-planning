import { Crown, MapPin, Images } from "lucide-react";
import { MeetingCover } from "@/entities/meeting/ui/MeetingCover";
import { ParticipantPreview } from "@/entities/meeting/ui/ParticipantPreview";
import { cardLabels } from "@/entities/meeting/lib/cardLabels";
import type { MeetingSummary } from "@/entities/meeting";
import { UnreadNotice } from "@prototype/entities/meeting/ui/UnreadNotice/UnreadNotice";
import styles from "@prototype/entities/meeting/ui/MeetingCard/MeetingCard.module.css";

export type MeetingCardProps = { meeting: MeetingSummary; past?: boolean };

export const MeetingCard = ({ meeting, past = false }: MeetingCardProps) => {
  const labels = cardLabels(meeting);
  return (
    <article
      className={styles.card}
      data-testid="meeting-card"
      data-weekend={["сб", "вс"].includes(labels.weekday)}
    >
      <a
        className={styles.main}
        href={meeting.id === "chat-dinner" ? "./chat/preview.html" : undefined}
        aria-label={meeting.title}
      >
        <time
          className={styles.date}
          dateTime={meeting.startsAt ?? meeting.startsOn ?? undefined}
        >
          {labels.date}
        </time>
        {meeting.coverUrl && (
          <div className={styles.cover}>
            <MeetingCover
              url={meeting.coverUrl}
              meeting={meeting.id}
              user="misha"
              fill
            />
          </div>
        )}
        <div className={styles.info} data-cover={!!meeting.coverUrl}>
          <h2>
            {meeting.title}
            {meeting.organizerId === "misha" && (
              <Crown size={16} aria-label="Вы организатор" />
            )}
          </h2>
          <p>
            <MapPin size={14} aria-hidden="true" />
            {meeting.place || "Место пока не выбрано"}
          </p>
          {labels.zone && <p className={styles.zone}>{labels.zone}</p>}
        </div>
        <div className={styles.footer}>
          <span>{!past && <UnreadNotice count={meeting.unreadCount} />}</span>
          <ParticipantPreview meeting={meeting} />
        </div>
      </a>
      {past && (
        <div className={styles.album}>
          <Images size={17} aria-hidden="true" />
          <span>
            {meeting.memoryPhotoCount
              ? `Вайб встречи · ${meeting.memoryPhotoCount} фото`
              : "Добавить фото встречи"}
          </span>
        </div>
      )}
    </article>
  );
};
