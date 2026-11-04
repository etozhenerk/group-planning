import { datePollSchema, request, writeOptions } from '@/shared/api';
import { mapDatePoll, wirePollSettings } from '@/entities/meeting/lib/mapDatePoll';
import type { PollAction, PollCreate } from '@/entities/meeting/model/datePoll';

export const getDatePoll = async (meeting: string, id: string, signal: AbortSignal) => {
  return mapDatePoll(
    await request(datePollSchema, `/meetings/${meeting}/date-polls/${id}`, { signal }),
  );
};

export const createDatePoll = async (
  meeting: string,
  input: PollCreate,
  csrf: string | null,
  key: string,
) => {
  return mapDatePoll(
    await request(
      datePollSchema,
      `/meetings/${meeting}/date-polls`,
      writeOptions(
        'POST',
        csrf,
        {
          dates: input.dates,
          closes_at: input.closesAt,
          settings: wirePollSettings(input.settings),
        },
        key,
      ),
    ),
  );
};

export const changeDatePoll = async (
  meeting: string,
  id: string,
  action: PollAction,
  csrf: string | null,
  key: string,
) => {
  const payload =
    action.kind === 'vote'
      ? { option_ids: action.optionIds, expected_revision: action.revision }
      : action.kind === 'options'
        ? { date: action.date, expected_revision: action.revision }
        : {
            option_id: action.optionId,
            expected_revision: action.revision,
            ...(action.startsAt !== undefined ? { starts_at: action.startsAt } : {}),
          };

  return mapDatePoll(
    await request(
      datePollSchema,
      `/meetings/${meeting}/date-polls/${id}/${action.kind}`,
      writeOptions(action.kind === 'vote' ? 'PUT' : 'POST', csrf, payload, key),
    ),
  );
};
