import { MapPin, Check, Minus } from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { portraitForName } from "@preview/portraits";
import { clockLabel } from "@/shared/lib/time";
import type { Session } from "@/entities/session";
import { PlaceBallot } from "@/features/place-poll/ui/PlaceBallot";
import { placePollStatus } from "@/features/place-poll/model/placePollCopy";
import { useChatModel } from "@preview/ChatContext";
import styles from "@preview/ui/PlaceCard/PlaceCard.module.css";
export type PlaceCardProps = {
  meeting: string;
  id: string;
  session: Session;
  author: string;
  occurredAt: string;
};
export const PlaceCard = ({ session, author, occurredAt }: PlaceCardProps) => {
  const m = useChatModel(),
    poll = m.placePoll,
    closed = poll.state !== "open";
  return (
    <section className={styles.card} aria-label="Опрос о месте">
      <div className={styles.byline}>
        <Avatar name={author} src={portraitForName(author)} size="small" />
        <span>{author}</span>
        <time>{clockLabel(occurredAt)}</time>
      </div>
      <div className={styles.caption}>
        <MapPin size={14} />
        <span>Опрос о месте</span>
      </div>
      {closed && (
        <div className={styles.result}>
          {poll.state === "applied" ? <Check size={16} /> : <Minus size={16} />}
          <span>{placePollStatus(poll, m.details.timezone)}</span>
        </div>
      )}
      <h3>{poll.place}</h3>
      {poll.explanation && (
        <p className={styles.explanation}>{poll.explanation}</p>
      )}
      <PlaceBallot poll={poll} session={session} />
      <div className={styles.footer}>
        {!closed ? (
          <>
            <span>{placePollStatus(poll, m.details.timezone)}</span>
            <span>Место пока прежнее</span>
          </>
        ) : poll.state === "applied" ? (
          <span>Голосование завершено</span>
        ) : (
          <span>{m.details.place}</span>
        )}
      </div>
    </section>
  );
};
