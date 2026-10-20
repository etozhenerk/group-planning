import type { MeetingDraft } from '@/entities/meeting/model/types';
import { timezoneLabel } from '@/shared/lib/time';

export const useMeetingTimeFields = (
  value: MeetingDraft,
  onChange: (value: MeetingDraft) => void,
) => {
  const [date = '', time = ''] = value.localTime.split('T');

  const changeDate = (next: string) => {
    onChange({ ...value, localTime: `${next}T${time}`, timeChoice: '' });
  };

  const changeTime = (next: string) => {
    onChange({ ...value, localTime: `${date}T${next}`, timeChoice: '' });
  };

  const changeChoice = (next: string) => {
    onChange({
      ...value,
      timeChoice: next === 'earlier' || next === 'later' ? next : '',
    });
  };

  return {
    date,
    time: time.slice(0, 5),
    changeDate,
    changeTime,
    changeChoice,
    zone: timezoneLabel(value.timezone),
  };
};
