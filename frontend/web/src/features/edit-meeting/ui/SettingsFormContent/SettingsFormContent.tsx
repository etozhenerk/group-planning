import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { useEdit } from '@/features/edit-meeting/model/useEdit';
import { DesktopSettingsFeedback } from '@/features/edit-meeting/ui/DesktopSettingsFeedback';
import { SettingsConflictReview } from '@/features/edit-meeting/ui/SettingsConflictReview';
import { EditConflict } from '@/features/edit-meeting/ui/EditConflict';
import { SettingsFormBody } from '@/features/edit-meeting/ui/SettingsFormBody';

export type SettingsFormContentProps = {
  meeting: Meeting;
  session: Session;
  form: ReturnType<typeof useEdit>;
  mobile: boolean;
  reviewing: boolean;
  resume: () => void;
  discard: () => void;
};

export const SettingsFormContent = ({
  meeting,
  session,
  form,
  mobile,
  reviewing,
  resume,
  discard,
}: SettingsFormContentProps) => {
  if (form.forbidden) {
    return (
      <>
        <p role="alert">Менять настройки может только организатор.</p>
        <button type="button" onClick={discard}>
          К информации о встрече
        </button>
      </>
    );
  }

  if (reviewing) {
    if (mobile && !form.rebaseReady) {
      return (
        <>
          <p role="status">Загружаем обновлённые данные…</p>
          <button
            type="button"
            onClick={() => {
              void form.refresh();
            }}
          >
            Повторить загрузку
          </button>
        </>
      );
    }

    if (mobile) {
      return <SettingsConflictReview meeting={meeting} />;
    }

    return (
      <EditConflict
        meeting={meeting}
        user={session.user.id}
        resume={resume}
        ready={form.rebaseReady}
        showResume={!mobile}
      />
    );
  }

  return (
    <>
      <SettingsFormBody meeting={meeting} session={session} form={form} mobile={mobile} />
      {!mobile && <DesktopSettingsFeedback problem={form.problem} />}
      {!mobile && form.conflict && (
        <EditConflict
          meeting={meeting}
          user={session.user.id}
          resume={form.resume}
          ready={form.rebaseReady}
        />
      )}
    </>
  );
};
