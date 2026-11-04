import { useMobileLayout } from '@/shared/lib/media';
import { CalendarView } from '@/pages/meetings/ui/CalendarView';
import { HomeEmpty } from '@/pages/meetings/ui/HomeEmpty';
import { MeetingsResults } from '@/pages/meetings/ui/MeetingsResults';
import { UndatedToggle } from '@/pages/meetings/ui/UndatedToggle';
import type { useMeetingsView } from '@/pages/meetings/ui/MeetingsView/hooks/useMeetingsView';

export type HomeContentProps = { view: ReturnType<typeof useMeetingsView> };

export const HomeContent = ({ view }: HomeContentProps) => {
  const mobile = useMobileLayout();

  return view.calendar ? (
    <CalendarView view={view} />
  ) : view.empty || (mobile && view.listEmpty) ? (
    <HomeEmpty createPath={view.createPath} period={view.selection.period} />
  ) : (
    <>
      <MeetingsResults
        key={`${view.selection.period}-${view.selection.undated}`}
        query={view.query}
        emptyTitle={
          view.selection.undated
            ? 'Встреч без даты нет.'
            : view.selection.period === 'past'
              ? 'Нет прошедших встреч'
              : 'Нет предстоящих встреч'
        }
      />
      <UndatedToggle
        count={view.counts?.undated}
        selected={view.selection.undated}
        onToggle={() => view.update({ undated: !view.selection.undated })}
      />
    </>
  );
};
