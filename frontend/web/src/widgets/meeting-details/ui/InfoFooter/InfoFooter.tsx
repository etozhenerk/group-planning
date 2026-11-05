import type { MouseEventHandler } from 'react';
import { answerLabels } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/widgets/meeting-details/ui/InfoFooter/InfoFooter.module.css';

export type InfoFooterProps = {
  meeting: Meeting;
  session: Session;
  share: MouseEventHandler<HTMLButtonElement>;
  respond: MouseEventHandler<HTMLButtonElement>;
};

export const InfoFooter = ({ meeting, session, share, respond }: InfoFooterProps) => (
  <div className={styles.footer} data-testid="info-footer">
    {meeting.organizerId === session.user.id ? (
      <button className={styles.invite} type="button" onClick={share}>
        <ChatIcon name="share" />
        Пригласить друзей
      </button>
    ) : (
      <div className={styles.response}>
        <span className={styles.check}>
          <ChatIcon name="check" />
        </span>
        <div>
          <small>Ваш ответ</small>
          <strong>{meeting.myRsvp ? answerLabels[meeting.myRsvp] : 'Без ответа'}</strong>
        </div>
        <button type="button" onClick={respond}>
          Изменить <ChatIcon name="down" size={16} />
        </button>
      </div>
    )}
  </div>
);
