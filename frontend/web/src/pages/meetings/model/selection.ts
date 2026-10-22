import { z } from 'zod';
import { validDay } from '@/pages/meetings/lib/calendarDates';

const selectionSchema = z.object({
  view: z.enum(['list', 'calendar']).catch('list'),
  period: z.enum(['upcoming', 'past']).catch('upcoming'),
  upcoming: z.string().nullable().catch(null),
  past: z.string().nullable().catch(null),
  undated: z.boolean().catch(false),
});

export type HomeSelection = z.infer<typeof selectionSchema>;

export const readSelection = (user: string, params: URLSearchParams): HomeSelection => {
  let saved: unknown = {};

  try {
    saved = JSON.parse(sessionStorage.getItem(`meeting-calendar:${user}`) ?? '{}');
  } catch {
    // Storage can be unavailable; URL navigation still preserves the selection.
  }

  const base = selectionSchema.safeParse(saved);
  const selection = base.success ? base.data : selectionSchema.parse({});

  if (params.has('view')) {
    selection.view = params.get('view') === 'calendar' ? 'calendar' : 'list';
    selection.period = params.get('period') === 'past' ? 'past' : 'upcoming';
    selection.undated = params.get('undated') === 'true';
    selection.upcoming = validDay(params.get('upcoming'));
    selection.past = validDay(params.get('past'));
  }

  return {
    ...selection,
    upcoming: validDay(selection.upcoming),
    past: validDay(selection.past),
  };
};

export const saveSelection = (
  user: string,
  selection: HomeSelection,
): URLSearchParams => {
  try {
    sessionStorage.setItem(`meeting-calendar:${user}`, JSON.stringify(selection));
  } catch {
    // A full or disabled storage must not block choosing a day.
  }

  const params = new URLSearchParams({ view: selection.view, period: selection.period });

  for (const period of ['upcoming', 'past'] as const) {
    if (selection[period]) {
      params.set(period, selection[period]);
    }
  }

  if (selection.undated) {
    params.set('undated', 'true');
  }

  return params;
};
