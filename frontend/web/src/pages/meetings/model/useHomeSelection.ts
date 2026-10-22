import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { CalendarPage } from '@/entities/meeting';
import { readSelection, saveSelection } from '@/pages/meetings/model/selection';
import type { HomeSelection } from '@/pages/meetings/model/selection';
import { today } from '@/pages/meetings/lib/calendarDates';

export const useHomeSelection = (user: string) => {
  const [params, setParams] = useSearchParams();
  const selection = useMemo(() => readSelection(user, params), [user, params]);
  const update = useCallback(
    (patch: Partial<HomeSelection>) => {
      setParams(saveSelection(user, { ...selection, ...patch }), { replace: true });
    },
    [user, selection, setParams],
  );

  return { selection, update };
};

export const useInitialDay = (
  selection: HomeSelection,
  page: CalendarPage | undefined,
  update: (patch: Partial<HomeSelection>) => void,
) => {
  useEffect(() => {
    if (selection.view === 'calendar' && !selection[selection.period] && page) {
      update({ [selection.period]: page.meetings[0]?.localDate ?? today() });
    }
  }, [selection, page, update]);
};
