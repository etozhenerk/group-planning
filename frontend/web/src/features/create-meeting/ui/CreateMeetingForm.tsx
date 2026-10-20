import type { Session } from '@/entities/session';
import { MeetingFields, DraftPreview } from '@/entities/meeting';
import { useCreateMeeting } from '@/features/create-meeting/model/useCreateMeeting';
import { DiscardDialog } from '@/features/create-meeting/ui/DiscardDialog';

export type CreateMeetingFormProps = { session: Session };

export const CreateMeetingForm = ({ session }: CreateMeetingFormProps) => {
  const form = useCreateMeeting(session);

  return (
    <>
      <div className="create-layout">
        <form onSubmit={form.submit} className="stack">
          <MeetingFields
            value={form.value}
            onChange={form.change}
            disabled={form.pending}
            errors={form.errors}
          />
          <p className="error" role="alert">
            {form.problem}
          </p>
          <button type="submit" className="primary" disabled={form.pending}>
            {form.pending ? 'Создаём встречу…' : 'Создать встречу'}
          </button>
          <p className="muted">После создания появится ссылка для друзей.</p>
        </form>
        <DraftPreview draft={form.value} />
      </div>
      <DiscardDialog
        open={form.unsaved.blocked}
        stay={form.unsaved.stay}
        leave={form.unsaved.leave}
      />
    </>
  );
};
