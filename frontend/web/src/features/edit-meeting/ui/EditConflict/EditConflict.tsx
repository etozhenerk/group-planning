import type { Meeting } from '@/entities/meeting';
import { MeetingFacts, MeetingCover } from '@/entities/meeting';

export type EditConflictProps = {
  meeting: Meeting;
  user: string;
  resume: () => void;
  ready: boolean;
};

export const EditConflict = ({ meeting, user, resume, ready }: EditConflictProps) => (
  <section aria-label="Обновлённые настройки">
    <h3>Сейчас во встрече</h3>
    <p>{meeting.title}</p>
    <MeetingFacts
      startsAt={meeting.startsAt}
      startsOn={meeting.startsOn ?? null}
      timezone={meeting.timezone}
      place={meeting.place}
    />
    {meeting.coverUrl && (
      <MeetingCover url={meeting.coverUrl} meeting={meeting.id} user={user} />
    )}
    <p>
      Ваши правки сохранены в форме. Проверьте новые данные перед повторной отправкой.
    </p>
    <button type="button" disabled={!ready} onClick={resume}>
      Продолжить с моими правками
    </button>
  </section>
);
