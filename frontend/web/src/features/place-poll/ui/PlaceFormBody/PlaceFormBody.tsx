import { useId } from 'react';
import type { Meeting } from '@/entities/meeting';
import { PollDeadline } from '@/entities/meeting';
import { RequiredLegend } from '@/shared/ui/RequiredLegend';
import { RequiredMark } from '@/shared/ui/RequiredMark';
import { PlaceManualFields } from '@/features/place-poll/ui/PlaceManualFields';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { designTokens } from '@/shared/config/design-tokens';
import type { useFormViewport } from '@/shared/lib/form';
import type { usePlaceForm } from '@/features/place-poll/model/usePlaceForm';

export type PlaceFormBodyProps = {
  mobile: boolean;
  meeting: Meeting;
  form: ReturnType<typeof usePlaceForm>;
  scroll: ReturnType<typeof useFormViewport>;
  classes: Readonly<Record<string, string>>;
};

export const PlaceFormBody = ({
  mobile,
  meeting,
  form,
  scroll,
  classes,
}: PlaceFormBodyProps) => {
  const placeId = useId(),
    reasonId = useId();

  return (
    <div className={classes.body} ref={scroll.viewport} onScroll={scroll.update}>
      <div ref={scroll.content}>
        {mobile && (
          <div className={classes.current}>
            <ChatIcon
              name="pin"
              size={designTokens.componentMobileFieldIconSize}
              aria-hidden="true"
            />
            <div>
              <span>Сейчас встречаемся здесь</span>
              <p>{meeting.place ?? 'Место пока не выбрано'}</p>
            </div>
          </div>
        )}
        <RequiredLegend spaced />
        {mobile ? (
          <PlaceManualFields
            form={form}
            fieldClassName={classes.field}
            placeId={placeId}
            reasonId={reasonId}
          />
        ) : (
          <>
            <label className={classes.field} htmlFor={placeId}>
              Новое место <RequiredMark />
              <input
                id={placeId}
                value={form.place}
                onChange={(e) => form.setPlace(e.target.value)}
                disabled={form.locked}
                required
              />
            </label>
            <label className={classes.field} htmlFor={reasonId}>
              Почему здесь
              <textarea
                id={reasonId}
                value={form.explanation}
                onChange={(e) => form.setExplanation(e.target.value)}
                disabled={form.locked}
                rows={3}
                maxLength={2000}
              />
            </label>
          </>
        )}
        <PollDeadline
          value={form.deadline}
          onChange={form.setDeadline}
          zone={meeting.timezone}
          choice={form.choice}
          onChoice={form.setChoice}
          ambiguous={form.problem.includes('дважды')}
          errors={mobile ? form.errors : undefined}
          disabled={form.locked}
        />
        {mobile && (
          <p className={classes.note}>
            Место изменится после окончания опроса, если большинство проголосует за.
          </p>
        )}
      </div>
    </div>
  );
};
