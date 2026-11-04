import { RequiredLegend } from '@/shared/ui/RequiredLegend';
import { useFormViewport } from '@/shared/lib/form';
import { useMobileLayout } from '@/shared/lib/media';
import { EditConflict } from '@/features/edit-meeting/ui/EditConflict';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import styles from '@/features/edit-meeting/ui/EditMeetingForm/EditMeetingForm.module.css';
import type { Meeting } from '@/entities/meeting';
import { MeetingFields, CoverEditor } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useEdit } from '@/features/edit-meeting/model/useEdit';

export type EditMeetingFormProps = {
  meeting: Meeting;
  session: Session;
  onSaved: () => void;
};

export const EditMeetingForm = ({ meeting, session, onSaved }: EditMeetingFormProps) => {
  const mobile = useMobileLayout();
  const scroll = useFormViewport();
  const form = useEdit(meeting, session, onSaved);

  const cover = (
    <CoverEditor
      compact
      value={form.value.cover}
      onChange={(cover) => form.change({ ...form.value, cover })}
      onBusy={form.setPreparing}
      disabled={form.locked}
      invalid={!!form.errors.cover}
      original={{ url: meeting.coverUrl, meeting: meeting.id, user: session.user.id }}
    />
  );

  const feedback = (
    <p role="alert" className={styles['error']}>
      {form.problem}
    </p>
  );

  return (
    <form onSubmit={form.submit} className={styles['stack']} data-mobile={mobile}>
      <div className={styles.body} ref={scroll.viewport} onScroll={scroll.update}>
        <div className={styles.content} ref={scroll.content}>
          {mobile && cover}
          <RequiredLegend />
          <MeetingFields
            settings
            dateRequired={!!meeting.startsAt || !!meeting.startsOn}
            value={form.value}
            onChange={form.change}
            disabled={form.locked}
            errors={form.errors}
          />
          {!mobile && cover}
          {!mobile && feedback}
          {form.conflict && (
            <EditConflict
              meeting={meeting}
              user={session.user.id}
              resume={form.resume}
              ready={form.rebaseReady}
            />
          )}
        </div>
      </div>
      <div className={styles.footer} data-sticky={scroll.overflow}>
        {mobile && feedback}
        <button
          type="submit"
          className={styles['primary']}
          disabled={form.pending || form.preparing || form.conflict}
          aria-label={form.uncertain ? 'Повторить отправку' : 'Сохранить изменения'}
          aria-busy={form.pending}
        >
          {form.pending ? (
            <ButtonSpinner />
          ) : form.uncertain ? (
            'Повторить отправку'
          ) : mobile ? (
            'Сохранить'
          ) : (
            'Сохранить изменения'
          )}
        </button>
      </div>
    </form>
  );
};
