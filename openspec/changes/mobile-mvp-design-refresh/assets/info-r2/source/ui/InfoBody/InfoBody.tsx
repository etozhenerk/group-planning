import { MeetingCover, MeetingFacts } from '@/entities/meeting';
import {portraitFor} from '@preview/model/portraits';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { ParticipantList } from '@/widgets/meeting-details/ui/ParticipantList';
import { useInfoModel } from '@preview/model/InfoContext';
import styles from '@preview/ui/InfoBody/InfoBody.module.css';
export const InfoBody = () => {
  const m = useInfoModel(),
    meeting = m.meeting;
  if (m.scenario === 'loading') {
    return <SkeletonDetails label="Загрузка встречи" />;
  }
  return (
    <div className={styles.body}>
      {meeting.coverUrl && (
        <div className={styles.cover}>
          <MeetingCover
            fill
            url={meeting.coverUrl}
            meeting={meeting.id}
            user={m.session.user.id}
          />
        </div>
      )}
      <div className={styles.heading}>
        <h1>{meeting.title}</h1>
        <div className={styles.organizer}>
          <Avatar name="Лена" size="small" tone="lilac" src={portraitFor("lena")} />
          <span>{m.organizer ? 'Вы организатор' : 'Организует Лена'}</span>
          {m.organizer && (
            <button
              onClick={(event) => m.showChild('settings', event.currentTarget)}
              aria-label="Настройки встречи"
            >
              <ChatIcon name="settings" size={20} />
            </button>
          )}
        </div>
      </div>
      <div className={styles.facts}>
        <MeetingFacts
          startsAt={meeting.startsAt}
          startsOn={meeting.startsOn}
          timezone={meeting.timezone}
          place={meeting.place}
        />
      </div>
      {meeting.description && <p className={styles.description}>{meeting.description}</p>}
      <div className={styles.company}>
        <ParticipantList meeting={meeting} user={m.session.user.id} compact={false} />
      </div>
    </div>
  );
};
