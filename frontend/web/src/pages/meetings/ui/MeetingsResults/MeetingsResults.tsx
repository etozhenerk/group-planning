import { EmptyDay } from '@/pages/meetings/ui/EmptyDay';
import { useMobileLayout } from '@/shared/lib/media';
import type { useCalendar } from '@/entities/meeting';
import { MeetingsList } from '@/pages/meetings/ui/MeetingsList';
import { MeetingsFailure } from '@/pages/meetings/ui/MeetingsFailure';
import { AgendaMeeting } from '@/pages/meetings/ui/AgendaMeeting';
import { MeetingsLoading } from '@/pages/meetings/ui/MeetingsLoading';
import styles from '@/pages/meetings/ui/MeetingsResults/MeetingsResults.module.css';

export type MeetingsResultsProps = {
  query: ReturnType<typeof useCalendar>;
  agenda?: boolean;
  emptyTitle: string;
  showError?: boolean;
};

export const MeetingsResults = ({
  query,
  agenda = false,
  emptyTitle,
  showError = true,
}: MeetingsResultsProps) => {
  const mobile = useMobileLayout();

  return (
    <div className={styles.results} aria-busy={query.isFetching}>
      {query.isPending ? (
        <MeetingsLoading agenda={agenda} />
      ) : (
        <>
          {query.error && showError && (
            <MeetingsFailure
              title={
                query.data
                  ? 'Не удалось обновить встречи'
                  : 'Не удалось загрузить встречи'
              }
              refresh={!!query.data}
              onRetry={() =>
                void (query.isFetchNextPageError
                  ? query.fetchNextPage()
                  : query.refetch())
              }
            />
          )}
          {query.data && (
            <>
              {query.data.pages.every((page) => page.meetings.length === 0) &&
                !query.error &&
                (mobile && agenda ? (
                  <EmptyDay text={emptyTitle} />
                ) : (
                  <p className={styles.empty}>{emptyTitle}</p>
                ))}
              <div className={styles.items} data-mobile={mobile}>
                {agenda ? (
                  query.data.pages
                    .flatMap((page) => page.meetings)
                    .map((meeting) => (
                      <AgendaMeeting key={meeting.id} meeting={meeting} />
                    ))
                ) : (
                  <MeetingsList
                    meetings={query.data.pages.flatMap((page) => page.meetings)}
                  />
                )}
              </div>
              {query.hasNextPage && (
                <button
                  type="button"
                  className={styles.more}
                  onClick={() => void query.fetchNextPage()}
                  disabled={query.isFetching}
                >
                  Показать ещё
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
