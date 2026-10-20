import type { Meeting } from '@/entities/meeting';
import { MeetingFields } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useEdit } from '@/features/edit-meeting/model/useEdit';

export type EditMeetingFormProps = {
  meeting: Meeting;
  session: Session;
  onSaved: () => void;
};

export const EditMeetingForm = ({ meeting, session, onSaved }: EditMeetingFormProps) => {
  const form = useEdit(meeting, session, onSaved);

  return (
    <form onSubmit={form.submit} className="stack">
      <MeetingFields
        value={form.value}
        onChange={form.change}
        disabled={form.pending}
        errors={form.errors}
      />
      <p role="alert" className="error">
        {form.problem}
      </p>
      {form.conflict && (
        <p className="muted">
          Закройте форму и проверьте обновлённые детали. Введённые изменения не применены.
        </p>
      )}
      <button type="submit" className="primary" disabled={form.pending || form.conflict}>
        {form.pending ? 'Сохраняем…' : 'Сохранить изменения'}
      </button>
    </form>
  );
};
