import { Link } from 'react-router';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import styles from '@/features/create-meeting/ui/CreateMeetingForm/CreateMeetingForm.module.css';
import type { Session } from '@/entities/session';
import { MeetingFields, CoverEditor } from '@/entities/meeting';
import { useCreateMeeting } from '@/features/create-meeting/model/useCreateMeeting';
import { DiscardDialog } from '@/features/create-meeting/ui/DiscardDialog';

export type CreateMeetingFormProps = { session: Session };

export const CreateMeetingForm = ({ session }: CreateMeetingFormProps) => {
  const form = useCreateMeeting(session);

  return (
    <>
      <div>
        <form onSubmit={form.submit} className={styles['stack']}>
          <MeetingFields
            value={form.value}
            onChange={form.change}
            disabled={form.locked}
            errors={form.errors}
          />
          <details className={styles.cover} open={!!form.value.cover || undefined}>
            <summary>Обложка</summary>
            <CoverEditor
              value={form.value.cover}
              onChange={(cover) => form.change({ ...form.value, cover })}
              onBusy={form.setPreparing}
              disabled={form.locked}
              invalid={!!form.errors.cover}
            />
          </details>
          <p className={styles['error']} role="alert">
            {form.problem}
          </p>
          <div className={styles.actions}>
            <Link to="/meetings" className={styles.cancel}>
              Отмена
            </Link>
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
          </div>
        </form>
      </div>
      <DiscardDialog
        open={form.unsaved.blocked}
        stay={form.unsaved.stay}
        leave={form.unsaved.leave}
      />
    </>
  );
};
