import { RequiredLegend } from '@/shared/ui/RequiredLegend';
import { useMobileLayout } from '@/shared/lib/media';
import { DraftDiscard } from '@/shared/ui/DraftDiscard';
import type { DraftExitRegistration } from '@/shared/lib/form';
import { PollSubmit } from '@/features/date-poll/ui/PollSubmit';
import { usePollExit } from '@/features/date-poll/ui/PollCreateForm/hooks/usePollExit';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { usePollForm } from '@/features/date-poll/model/usePollForm';
import { PollDatesFields } from '@/features/date-poll/ui/PollDatesFields';
import { PollDeadline } from '@/entities/meeting';
import { PollSettingsFields } from '@/features/date-poll/ui/PollSettingsFields';
import { usePollViewport } from '@/features/date-poll/ui/PollCreateForm/hooks/usePollViewport';
import styles from '@/features/date-poll/ui/PollCreateForm/PollCreateForm.module.css';

export type PollCreateFormProps = {
  meeting: Meeting;
  session: Session;
  done: () => void;
  active?: boolean;
  onRegisterClose?: DraftExitRegistration | undefined;
  onModeChange?: ((title: string) => void) | undefined;
};

export const PollCreateForm = (props: PollCreateFormProps) => {
  const { meeting, session, done } = props;
  const mobile = useMobileLayout();
  const form = usePollForm(meeting, session, done);
  const scroll = usePollViewport(form.attempt);
  const exit = usePollExit(props, mobile, form.dirty, form.locked);

  if (exit.confirm) {
    return (
      <DraftDiscard
        text="Варианты и настройки опроса не сохранятся."
        stay={exit.stay}
        leave={exit.leave}
      />
    );
  }

  const settings = (
    <PollSettingsFields
      value={form.settings}
      onChange={form.changeSetting}
      disabled={form.locked}
    />
  );

  return (
    <form
      noValidate={mobile}
      onSubmit={form.submit}
      className={styles['form']}
      data-mobile={mobile}
    >
      <div
        className={styles['body']}
        ref={scroll.viewport}
        onScroll={scroll.update}
        data-testid="poll-form-scroll"
      >
        <div ref={scroll.content}>
          <RequiredLegend spaced />
          <PollDatesFields
            dates={form.dates}
            errors={form.dateErrors}
            zone={meeting.timezone}
            change={form.changeDate}
            add={form.add}
            remove={form.remove}
            disabled={form.locked}
          />
          {mobile && settings}
          <PollDeadline
            value={form.deadline}
            onChange={form.setDeadline}
            zone={meeting.timezone}
            choice={form.choice}
            onChoice={form.setChoice}
            errors={mobile ? form.deadlineErrors : undefined}
            ambiguous={form.problem.includes('дважды')}
            disabled={form.locked}
          />
          {!mobile && settings}
        </div>
      </div>
      <div
        className={[styles.footer, scroll.hasMore ? styles.overflowing : ''].join(' ')}
        data-testid="poll-form-footer"
        data-sticky={scroll.overflow}
      >
        <PollSubmit
          mobile={mobile}
          problem={mobile && Object.keys(form.deadlineErrors).length ? '' : form.problem}
          uncertain={form.uncertain}
          failed={form.failed}
          pending={form.pending}
          errorClassName={styles.error}
        />
      </div>
    </form>
  );
};
