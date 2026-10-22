import { useCalendar } from '@/entities/meeting';
import { useHomeSelection, useInitialDay } from '@/pages/meetings/model/useHomeSelection';
import { addDays, monthRange, today } from '@/pages/meetings/lib/calendarDates';

export const useMeetingsView = (user: string) => {
  const { selection, update } = useHomeSelection(user);
  const list = useCalendar(user, { period: selection.period });
  useInitialDay(selection, list.data?.pages[0], update);
  const day = selection[selection.period] ?? today();
  const calendar = selection.view === 'calendar';
  const ready = calendar && !!selection[selection.period];
  const month = useCalendar(
    user,
    { period: selection.period, ...monthRange(day) },
    ready,
  );

  const agenda = useCalendar(
    user,
    { period: selection.period, from: day, to: addDays(day, 1) },
    ready && !selection.undated,
  );

  const undated = useCalendar(user, { period: 'undated' }, selection.undated);
  const query = selection.undated ? undated : calendar ? agenda : list;
  const metadata = [list, month, agenda, undated]
    .flatMap((result) => (result.data ? [result.data.pages[0]!] : []))
    .sort((a, b) => b.asOf.localeCompare(a.asOf))[0];

  const counts = metadata?.counts;
  const empty =
    !!counts &&
    counts.upcoming + counts.past + counts.undated === 0 &&
    query.isSuccess &&
    !list.isError &&
    !(calendar && month.isError);

  const selectDay = (value: string) =>
    update({ [selection.period]: value, undated: false });

  return {
    selection,
    update,
    day,
    calendar,
    ready,
    list,
    month,
    query,
    counts,
    empty,
    selectDay,
  };
};
