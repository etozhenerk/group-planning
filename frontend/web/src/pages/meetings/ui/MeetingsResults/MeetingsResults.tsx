import type { useCalendar } from '@/entities/meeting';
import { MeetingsList } from '@/pages/meetings/ui/MeetingsList';
import { Status } from '@/shared/ui/Status';
import { AgendaMeeting } from '@/pages/meetings/ui/AgendaMeeting';
import { MeetingsLoading } from '@/pages/meetings/ui/MeetingsLoading';
import styles from '@/pages/meetings/ui/MeetingsResults/MeetingsResults.module.css';

export type MeetingsResultsProps = {
  query: ReturnType<typeof useCalendar>;
  agenda?: boolean;
  emptyTitle: string;
};

export const MeetingsResults = ({
  query,
  agenda = false,
  emptyTitle,
}: MeetingsResultsProps) => {
  return (
    <div className={styles.results}>
      {query.isPending ? (
        <MeetingsLoading agenda={agenda} />
      ) : (
        <>
          {query.error && (
            <Status
              title={
                query.data
                  ? 'Не удалось обновить встречи'
                  : 'Не удалось загрузить встречи'
              }
              error
              action={() =>
                void (query.isFetchNextPageError
                  ? query.fetchNextPage()
                  : query.refetch())
              }
            />
          )}
          {query.data && (
            <>
              {query.data.pages.every((page) => page.meetings.length === 0) &&
                !query.error && <p className={styles.empty}>{emptyTitle}</p>}
              <div className={styles.items}>
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
