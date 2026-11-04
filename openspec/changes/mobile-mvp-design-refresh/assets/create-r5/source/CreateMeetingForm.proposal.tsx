import { SubmissionNotice } from '@preview/SubmissionNotice';
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
        <form noValidate onSubmit={form.submit} className={styles['stack']}>
          <CoverEditor
            value={form.value.cover}
            onChange={(cover) => form.change({ ...form.value, cover })}
            onBusy={form.setPreparing}
            disabled={form.locked}
            invalid={!!form.errors.cover}
            prominent compact
          />
          <MeetingFields
            value={form.value}
            onChange={form.change}
            disabled={form.locked}
            errors={form.errors}
          />
          <div className={styles.actions} data-create-actions>
            <SubmissionNotice message={form.problem} uncertain={form.uncertain}/>
            <Link to="/meetings" className={styles.cancel}>
              Отмена
            </Link>
            <button
              type="submit"
              className={styles['primary']}
              disabled={form.pending || form.preparing}
              aria-label={form.uncertain ? 'Повторить отправку' : form.problem ? 'Попробовать снова' : 'Создать встречу'}
              aria-busy={form.pending}
            >
              {form.pending ? (
                <ButtonSpinner />
              ) : form.uncertain ? (
                'Повторить отправку'
              ) : (
                form.problem ? 'Попробовать снова' : 'Создать встречу'
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
