import type { Meeting } from '@/entities/meeting';
import { MeetingFacts } from '@/entities/meeting';
import styles from '@preview/ui/ConflictReview/ConflictReview.module.css';
export type ConflictReviewProps = {
  meeting: Meeting;
  resume: () => void;
  back: () => void;
};
export const ConflictReview = ({ meeting, resume, back }: ConflictReviewProps) => (
  <div className={styles.review} data-testid="settings-conflict-review">
    <div className={styles.body}>
      <h3>Сейчас во встрече</h3>
      <h4>{meeting.title}</h4>
      <MeetingFacts
        startsAt={meeting.startsAt}
        startsOn={meeting.startsOn}
        timezone={meeting.timezone}
        place={meeting.place}
      />
      <p>
        Ваши правки остались в форме. Обновлённые поля, которые вы не меняли, подставятся
        автоматически.
      </p>
    </div>
    <div className={styles.footer}>
      <button onClick={resume}>Продолжить с моими правками</button>
    </div>
  </div>
);
