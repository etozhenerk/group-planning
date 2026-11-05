import { useEditMeetingForm } from '@/features/edit-meeting/ui/EditMeetingForm/hooks/useEditMeetingForm';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { DesktopSettingsSubmit } from '@/features/edit-meeting/ui/DesktopSettingsSubmit';
import { SettingsDiscard } from '@/features/edit-meeting/ui/SettingsDiscard';
import { SettingsFormContent } from '@/features/edit-meeting/ui/SettingsFormContent';
import { SettingsSubmit } from '@/features/edit-meeting/ui/SettingsSubmit';
import styles from '@/features/edit-meeting/ui/EditMeetingForm/EditMeetingForm.module.css';

export type EditMeetingFormProps = {
  meeting: Meeting;
  session: Session;
  onSaved: () => void;
  active?: boolean;
  onRegisterClose?: ((handler: (() => boolean) | null) => void) | undefined;
  onModeChange?: ((title: string) => void) | undefined;
  onDiscard?: ((navigating: boolean) => void) | undefined;
};

export const EditMeetingForm = ({
  meeting,
  session,
  onSaved,
  active = true,
  onRegisterClose,
  onModeChange,
  onDiscard,
}: EditMeetingFormProps) => {
  const { mobile, scroll, form, formRef, reviewing, setReviewing, exit } =
    useEditMeetingForm({
      meeting,
      session,
      onSaved,
      active,
      onRegisterClose,
      onModeChange,
      onDiscard,
    });

  return (
    <>
      {exit.confirm && <SettingsDiscard stay={exit.stay} leave={exit.leave} />}
      <form
        ref={formRef}
        noValidate
        onSubmit={form.submit}
        className={styles.stack}
        data-mobile={mobile}
        data-review={mobile && reviewing}
        hidden={exit.confirm}
      >
        <div className={styles.body} ref={scroll.viewport} onScroll={scroll.update}>
          <div className={styles.content} ref={scroll.content}>
            <SettingsFormContent
              meeting={meeting}
              session={session}
              form={form}
              mobile={mobile}
              reviewing={reviewing}
              resume={() => {
                form.resume();
                setReviewing(false);
              }}
              discard={() => onDiscard?.(false)}
            />
          </div>
        </div>
        {!form.forbidden && (
          <div className={styles.footer} data-sticky={scroll.overflow}>
            {!mobile ? (
              <DesktopSettingsSubmit form={form} />
            ) : (
              <SettingsSubmit
                form={form}
                mobile={mobile}
                review={() => setReviewing(true)}
                reviewing={reviewing}
                resume={() => {
                  form.resume();
                  setReviewing(false);
                }}
              />
            )}
          </div>
        )}
      </form>
    </>
  );
};
