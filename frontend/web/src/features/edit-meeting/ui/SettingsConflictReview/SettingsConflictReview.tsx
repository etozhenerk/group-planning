import type { Meeting } from '@/entities/meeting';
import { MeetingFacts } from '@/entities/meeting';
import styles from '@/features/edit-meeting/ui/SettingsConflictReview/SettingsConflictReview.module.css';

export type SettingsConflictReviewProps = { meeting: Meeting };

export const SettingsConflictReview = ({ meeting }: SettingsConflictReviewProps) => (
  <section className={styles.review} data-testid="settings-conflict-review">
    <h3>Сейчас во встрече</h3>
    <h4>{meeting.title}</h4>
    <MeetingFacts
      startsAt={meeting.startsAt}
      startsOn={meeting.startsOn ?? null}
      timezone={meeting.timezone}
      place={meeting.place}
    />
    <p>
      Ваши правки остались в форме. Обновлённые поля, которые вы не меняли, подставятся
      автоматически.
    </p>
  </section>
);
