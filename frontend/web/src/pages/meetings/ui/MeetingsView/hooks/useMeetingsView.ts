import { useCalendar, useCalendarCounts } from '@/entities/meeting';
import { useHomeSelection, useInitialDay } from '@/pages/meetings/model/useHomeSelection';
import { addDays, monthRange, today } from '@/entities/meeting';

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
  const counts = useCalendarCounts(user);
  const empty =
    !!counts &&
    counts.upcoming + counts.past + counts.undated === 0 &&
    !query.isError &&
    !list.isError &&
    !(calendar && month.isError);

  const listEmpty =
    !calendar &&
    !selection.undated &&
    !query.isPending &&
    !query.error &&
    !!query.data &&
    query.data.pages.every((page) => page.meetings.length === 0);

  const dayPage = agenda.data?.pages[0] ?? month.data?.pages[0];
  const dayCount = dayPage
    ? (dayPage.days.find((entry) => entry.date === day)?.count ?? 0)
    : empty
      ? 0
      : undefined;

  const createPath =
    calendar && !selection.undated ? `/meetings/new?date=${day}` : '/meetings/new';

  const retryCalendar = () => {
    void list.refetch();

    if (ready) {
      void month.refetch();
      void query.refetch();
    }
  };

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
    listEmpty,
    dayCount,
    createPath,
    selectDay,
    retryCalendar,
  };
};
