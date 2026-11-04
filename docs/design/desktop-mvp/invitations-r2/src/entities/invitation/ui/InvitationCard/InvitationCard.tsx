import { MapPin, ArrowUpRight } from "lucide-react";
import { MeetingCover, cardLabels } from "@/entities/meeting";
import type { SavedInvitation } from "@/entities/meeting";
import { InvitationAuthor } from "@inv/entities/invitation/ui/InvitationAuthor/InvitationAuthor";
import styles from "@inv/entities/invitation/ui/InvitationCard/InvitationCard.module.css";

export type InvitationCardProps = {
  item: SavedInvitation;
  photo: string | null;
  onOpen: () => void;
};

export const InvitationCard = ({
  item,
  photo,
  onOpen,
}: InvitationCardProps) => {
  const data = item.preview,
    labels = cardLabels(data);
  return (
    <article
      className={styles.card}
      data-testid="invitation-card"
      data-weekend={["сб", "вс"].includes(labels.weekday)}
      style={{ viewTransitionName: `invitation-${data.meetingId}` }}
    >
      <button
        className={styles.open}
        type="button"
        onClick={onOpen}
        aria-label={`Изменить ответ: ${data.title}`}
      />
      <time
        className={styles.date}
        dateTime={data.startsAt ?? data.startsOn ?? undefined}
      >
        {labels.date}
      </time>
      {data.coverUrl && (
        <div className={styles.cover}>
          <MeetingCover url={data.coverUrl} meeting={data.meetingId} fill />
        </div>
      )}
      <div className={styles.info} data-cover={!!data.coverUrl}>
        <h2>{data.title}</h2>
        <p>
          <MapPin size={14} aria-hidden="true" />
          {data.place || "Место пока не выбрано"}
        </p>
      </div>
      <div className={styles.footer}>
        <InvitationAuthor
          name={data.organizer?.displayName ?? "Организатор"}
          photo={photo}
        />
        <span className={styles.action}>
          Изменить ответ
          <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
};
