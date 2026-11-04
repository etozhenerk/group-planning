import { useMobileLayout } from '@/shared/lib/media';
import { InvitationsFailure } from '@/pages/invitations/ui/InvitationsFailure';
import { InvitationEmpty } from '@/pages/invitations/ui/InvitationEmpty';
import { LoaderCircle } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import { Workspace } from '@/shared/ui/Workspace';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import type { Session } from '@/entities/session';
import { useSavedInvitations } from '@/entities/meeting';
import { InvitationCard } from '@/pages/invitations/ui/InvitationCard';
import styles from '@/pages/invitations/ui/InvitationsView/InvitationsView.module.css';

export type InvitationsViewProps = { session: Session };

export const InvitationsView = ({ session }: InvitationsViewProps) => {
  const query = useSavedInvitations(session.user.id);
  const mobile = useMobileLayout();
  const items = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.invitations)
        .map((item) => [item.preview.meetingId, item]),
    ).values(),
  ];

  return (
    <Workspace navigation={<Navigation session={session} sticky />} screen>
      <main id="main" className={styles.home} data-mobile={mobile}>
        <div className={styles.controls}>
          <header className={styles.heading}>
            <h1>Приглашения</h1>
            {mobile && query.data && (
              <span
                className={styles.count}
                aria-label={`Показано приглашений: ${items.length}${query.hasNextPage ? ', есть ещё' : ''}`}
              >
                {items.length}
                {query.hasNextPage ? '+' : ''}
              </span>
            )}
          </header>
          <p>
            {mobile
              ? 'Здесь встречи, на которые вы ответили «Возможно». Откройте приглашение, чтобы изменить ответ.'
              : 'Здесь сохранены приглашения, на которые вы ответили «Возможно». Когда определитесь, откройте приглашение и измените ответ.'}
          </p>
        </div>
        <div className={styles.scroll} data-testid="invitations-scroll">
          {query.isPending ? (
            <SkeletonRows label="Загрузка приглашений" />
          ) : (
            <>
              {query.error && (
                <InvitationsFailure
                  refresh={!!query.data}
                  onRetry={() =>
                    void (query.isFetchNextPageError
                      ? query.fetchNextPage()
                      : query.refetch())
                  }
                />
              )}
              {!query.error && !items.length && <InvitationEmpty />}
              <div className={styles.items}>
                {items.map((item) => (
                  <InvitationCard key={item.preview.meetingId} item={item} />
                ))}
              </div>
              {query.hasNextPage && (
                <button
                  className={styles.more}
                  type="button"
                  disabled={query.isFetching}
                  aria-busy={query.isFetchingNextPage}
                  aria-label="Показать ещё"
                  onClick={() => void query.fetchNextPage()}
                >
                  {query.isFetchingNextPage ? (
                    <LoaderCircle
                      size={20}
                      className={styles.spinner}
                      aria-hidden="true"
                    />
                  ) : (
                    'Показать ещё'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </Workspace>
  );
};
