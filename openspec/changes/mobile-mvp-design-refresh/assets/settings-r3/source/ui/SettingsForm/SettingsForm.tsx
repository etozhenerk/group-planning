import { MeetingFields, CoverEditor } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { useEdit } from '@/features/edit-meeting/model/useEdit';
import { useInfoModel } from '@preview/model/InfoContext';
import { SettingsFeedback } from '@preview/ui/SettingsFeedback';
import { ExitGuard } from '@preview/ui/ExitGuard';
import { ConflictReview } from '@preview/ui/ConflictReview';
import styles from '@preview/ui/SettingsForm/SettingsForm.module.css';
export type SettingsFormProps = {
  meeting: Meeting;
  session: Session;
  onSaved: () => void;
};
export const SettingsForm = ({ meeting, session, onSaved }: SettingsFormProps) => {
  const form = useEdit(meeting, session, onSaved),
    m = useInfoModel();
  if (m.guard) {
    return <ExitGuard stay={form.stay} leave={form.leave} />;
  }
  if (form.review) {
    return (
      <ConflictReview
        meeting={meeting}
        resume={form.resume}
        back={() => form.setReview(false)}
      />
    );
  }
  return (
    <form
      noValidate
      onSubmit={form.submit}
      className={styles.form}
      data-testid="settings-form"
    >
      <div className={styles.body} data-testid="settings-scroll">
        <CoverEditor
          compact
          value={form.value.cover}
          original={{ url: meeting.coverUrl, meeting: meeting.id, user: session.user.id }}
          onChange={(cover) => form.change({ ...form.value, cover })}
          onBusy={form.setPreparing}
          disabled={form.locked}
          invalid={!!form.errors.cover}
        />
        <p className={styles.legend}>
          <span aria-hidden="true">*</span> Обязательные поля
        </p>
        <MeetingFields
          settings
          value={form.value}
          onChange={form.change}
          disabled={form.locked}
          errors={form.errors}
        />
      </div>
      <div className={styles.footer} data-testid="settings-footer">
        <SettingsFeedback problem={form.problem} />
        <button
          type="submit"
          className={styles.save}
          disabled={form.pending || form.preparing}
          aria-busy={form.pending}
          aria-label={
            form.uncertain
              ? 'Повторить отправку'
              : form.conflict
                ? 'Проверить изменения'
                : form.problem === 'error'
                  ? 'Попробовать снова'
                  : 'Сохранить изменения'
          }
        >
          {form.pending ? (
            <ButtonSpinner />
          ) : form.uncertain ? (
            'Повторить отправку'
          ) : form.conflict ? (
            'Проверить изменения'
          ) : form.problem === 'error' ? (
            'Попробовать снова'
          ) : (
            'Сохранить'
          )}
        </button>
      </div>
    </form>
  );
};
