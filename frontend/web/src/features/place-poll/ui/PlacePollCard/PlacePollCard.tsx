import { useMobileLayout } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
import { PlaceByline } from '@/features/place-poll/ui/PlaceByline';
import { PlacePollFooter } from '@/features/place-poll/ui/PlacePollFooter';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { clockLabel } from '@/shared/lib/time';
import type { PlacePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { PlaceBallot } from '@/features/place-poll/ui/PlaceBallot';
import { placePollStatus } from '@/features/place-poll/model/placePollCopy';
import styles from '@/features/place-poll/ui/PlacePollCard/PlacePollCard.module.css';

export type PlacePollCardProps = {
  poll: PlacePoll | undefined;
  session: Session;
  author: string;
  authorAvatar?: string | null | undefined;
  occurredAt: string;
  zone: string;
  pending?: boolean;
  error?: unknown;
  retry?: () => void;
  now?: number;
  currentPlace?: string | null;
};

export const PlacePollCard = ({
  poll,
  session,
  author,
  authorAvatar,
  occurredAt,
  zone,
  pending = false,
  error,
  retry,
  now = Date.now(),
  currentPlace = null,
}: PlacePollCardProps) => {
  const mobile = useMobileLayout();

  return (
    <section className={styles.card} data-mobile={mobile} aria-label="Опрос о месте">
      {mobile && (
        <PlaceByline author={author} avatar={authorAvatar} occurredAt={occurredAt} />
      )}
      <div className={styles.caption}>
        <ChatIcon
          name="pin"
          {...(mobile ? { size: designTokens.componentMobileCreationHintIconSize } : {})}
          aria-hidden="true"
        />
        {mobile ? (
          <span>Опрос о месте</span>
        ) : (
          <>
            <span>
              {author} · {clockLabel(occurredAt)}
            </span>
            <span className={styles.status}>Опрос</span>
          </>
        )}
      </div>
      {poll ? (
        <>
          {mobile && poll.state !== 'open' && (
            <p className={styles.result}>{placePollStatus(poll, zone, now)}</p>
          )}
          <h3>{poll.place}</h3>
          {poll.explanation && <p className={styles.explanation}>{poll.explanation}</p>}
          <PlaceBallot poll={poll} session={session} now={now} />
          <div className={styles.footer}>
            {mobile ? (
              <PlacePollFooter
                poll={poll}
                zone={zone}
                now={now}
                currentPlace={currentPlace}
              />
            ) : (
              <>
                {placePollStatus(poll, zone, now)}
                {poll.state === 'open' && ' · место пока прежнее'}
              </>
            )}
          </div>
        </>
      ) : pending ? (
        <SkeletonRows label="Загрузка опроса" variant="agenda" />
      ) : null}
      {!!error && (
        <div role="alert">
          <p>Не удалось загрузить опрос.</p>
          <button type="button" onClick={retry}>
            Повторить
          </button>
        </div>
      )}
    </section>
  );
};
