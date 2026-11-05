import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { DraftExitRegistration } from '@/shared/lib/form';
import { ActionNotice } from '@/shared/ui/ActionNotice';
import { DraftDiscard } from '@/shared/ui/DraftDiscard';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { PlaceFormBody } from '@/features/place-poll/ui/PlaceFormBody';
import { usePlaceSurface } from '@/features/place-poll/ui/PlacePollForm/hooks/usePlaceSurface';
import styles from '@/features/place-poll/ui/PlacePollForm/PlacePollForm.module.css';

export type PlacePollFormProps = {
  meeting: Meeting;
  session: Session;
  done: () => void;
  active?: boolean;
  onRegisterClose?: DraftExitRegistration | undefined;
  onDiscard?: ((navigating: boolean) => void) | undefined;
  onModeChange?: ((title: string) => void) | undefined;
};

export const PlacePollForm = (props: PlacePollFormProps) => {
  const { mobile, form, scroll, formRef, exit } = usePlaceSurface(props);

  if (exit.confirm) {
    return (
      <DraftDiscard
        text="Место и пояснение не сохранятся."
        stay={exit.stay}
        leave={exit.leave}
      />
    );
  }

  const problem = mobile && Object.keys(form.errors).length ? '' : form.problem;
  const title = form.uncertain
    ? 'Повторить отправку'
    : mobile && form.failed
      ? 'Попробовать снова'
      : 'Предложить место';

  return (
    <form
      noValidate={mobile}
      ref={formRef}
      onSubmit={form.submit}
      className={styles.form}
      data-mobile={mobile}
    >
      <PlaceFormBody
        mobile={mobile}
        form={form}
        scroll={scroll}
        meeting={props.meeting}
        classes={styles}
      />
      <div className={styles.footer} data-sticky={scroll.overflow}>
        {problem &&
          (mobile ? (
            <ActionNotice
              title={form.uncertain ? 'Создание опроса не подтверждено' : problem}
              text={
                form.uncertain
                  ? 'Повторите отправку — данные менять не нужно.'
                  : 'Место и пояснение остались в форме.'
              }
            />
          ) : (
            <p role="alert" className={styles.error}>
              {problem}
            </p>
          ))}
        <button
          type="submit"
          disabled={form.pending}
          aria-busy={form.pending}
          aria-label={title}
        >
          {form.pending ? <ButtonSpinner /> : title}
        </button>
      </div>
    </form>
  );
};
