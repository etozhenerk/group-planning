import { useRef } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { useInvalidFocus } from '@/shared/lib/form';
import { RequiredLegend } from '@/shared/ui/RequiredLegend';
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
  const mobile = useMobileLayout();
  const formRef = useRef<HTMLFormElement>(null);
  useInvalidFocus(formRef, form.validationAttempt);

  return (
    <>
      <div>
        <form
          onSubmit={form.submit}
          className={styles['stack']}
          noValidate={mobile}
          ref={formRef}
        >
          <CoverEditor
            value={form.value.cover}
            onChange={(cover) => form.change({ ...form.value, cover })}
            onBusy={form.setPreparing}
            disabled={form.locked}
            invalid={!!form.errors.cover}
            prominent
          />
          <RequiredLegend />
          <MeetingFields
            value={form.value}
            onChange={form.change}
            disabled={form.locked}
            errors={form.errors}
          />
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
