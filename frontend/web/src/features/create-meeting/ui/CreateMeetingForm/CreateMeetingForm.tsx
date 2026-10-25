import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import styles from '@/features/create-meeting/ui/CreateMeetingForm/CreateMeetingForm.module.css';
import type { Session } from '@/entities/session';
import { MeetingFields, DraftPreview, CoverEditor } from '@/entities/meeting';
import { useCreateMeeting } from '@/features/create-meeting/model/useCreateMeeting';
import { DiscardDialog } from '@/features/create-meeting/ui/DiscardDialog';

export type CreateMeetingFormProps = { session: Session };

export const CreateMeetingForm = ({ session }: CreateMeetingFormProps) => {
  const form = useCreateMeeting(session);

  return (
    <>
      <div className={styles['create-layout']}>
        <form onSubmit={form.submit} className={styles['stack']}>
          <MeetingFields
            value={form.value}
            onChange={form.change}
            disabled={form.locked}
            errors={form.errors}
          />
          <CoverEditor
            value={form.value.cover}
            onChange={(cover) => form.change({ ...form.value, cover })}
            onBusy={form.setPreparing}
            disabled={form.locked}
            invalid={!!form.errors.cover}
          />
          <p className={styles['error']} role="alert">
            {form.problem}
          </p>
          <button
            type="submit"
            className={styles['primary']}
            disabled={form.pending || form.preparing}
            aria-label={form.uncertain ? 'Повторить отправку' : 'Создать встречу'}
            aria-busy={form.pending}
          >
            {form.pending ? (
              <ButtonSpinner />
            ) : form.uncertain ? (
              'Повторить отправку'
            ) : (
              'Создать встречу'
            )}
          </button>
          <p className={styles['muted']}>После создания появится ссылка для друзей.</p>
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
