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
import { ActionNotice } from '@/shared/ui/ActionNotice';
import { useCreationFooter } from '@/features/create-meeting/ui/CreateMeetingForm/hooks/useCreationFooter';

export type CreateMeetingFormProps = { session: Session };

export const CreateMeetingForm = ({ session }: CreateMeetingFormProps) => {
  const form = useCreateMeeting(session);
  const mobile = useMobileLayout();
  const formRef = useRef<HTMLFormElement>(null);
  const footer = useCreationFooter(formRef, mobile);
  useInvalidFocus(formRef, form.validationAttempt);
  const submitLabel = form.uncertain
    ? 'Повторить отправку'
    : mobile && form.problem
      ? 'Попробовать снова'
      : 'Создать встречу';

  return (
    <>
      <div>
        <form
          onSubmit={form.submit}
          className={styles['stack']}
          noValidate={mobile}
          ref={formRef}
          data-mobile={mobile}
        >
          {mobile && <RequiredLegend sentence />}
          <CoverEditor
            value={form.value.cover}
            onChange={(cover) => form.change({ ...form.value, cover })}
            onBusy={form.setPreparing}
            disabled={form.locked}
            invalid={!!form.errors.cover}
            prominent={!mobile}
            compact={mobile}
          />
          {!mobile && <RequiredLegend />}
          <MeetingFields
            creation
            value={form.value}
            onChange={form.change}
            disabled={form.locked}
            errors={form.errors}
          />
          {!mobile && (
            <p className={styles['error']} role="alert">
              {form.problem}
            </p>
          )}
          <div className={styles.actions} ref={footer}>
            {mobile && form.problem && (
              <ActionNotice
                title={
                  form.uncertain
                    ? 'Не удалось подтвердить создание'
                    : 'Не удалось создать встречу'
                }
                text={
                  form.uncertain
                    ? 'Повторите отправку — данные менять не нужно.'
                    : form.problem
                }
              />
            )}
            <Link to="/meetings" className={styles.cancel}>
              Отмена
            </Link>
            <button
              type="submit"
              className={styles['primary']}
              disabled={form.pending || form.preparing}
              aria-label={submitLabel}
              aria-busy={form.pending}
            >
              {form.pending ? <ButtonSpinner /> : submitLabel}
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
