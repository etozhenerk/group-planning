import { Link } from 'react-router';
import { Plus, LoaderCircle } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import { HomeTabs } from '@/widgets/home-tabs';
import { Workspace } from '@/shared/ui/Workspace';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { Status } from '@/shared/ui/Status';
import type { Session } from '@/entities/session';
import { useSavedInvitations } from '@/entities/meeting';
import { InvitationCard } from '@/pages/invitations/ui/InvitationCard';
import styles from '@/pages/invitations/ui/InvitationsView/InvitationsView.module.css';

export type InvitationsViewProps = { session: Session };

export const InvitationsView = ({ session }: InvitationsViewProps) => {
  const query = useSavedInvitations(session.user.id);
  const items = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.invitations)
        .map((item) => [item.preview.meetingId, item]),
    ).values(),
  ];

  return (
    <Workspace navigation={<Navigation session={session} sticky />}>
      <main id="main" className={styles.home}>
        <div className={styles.controls}>
          <header className={styles.heading}>
            <h1>Мои встречи</h1>
            <Link
              to="/meetings/new"
              className={styles.create}
              aria-label="Создать встречу"
            >
              <Plus size={18} aria-hidden="true" />
              Создать
            </Link>
          </header>
          <HomeTabs />
        </div>
        {query.isPending ? (
          <SkeletonRows label="Загрузка приглашений" />
        ) : (
          <>
            {query.error && (
              <Status
                title={
                  query.data
                    ? 'Не удалось обновить приглашения'
                    : 'Не удалось загрузить приглашения'
                }
                error
                action={() =>
                  void (query.isFetchNextPageError
                    ? query.fetchNextPage()
                    : query.refetch())
                }
              />
            )}
            {!query.error && !items.length && (
              <Status
                title="Пока нет приглашений"
                text="Здесь будут встречи, на которые вы ответили «Возможно»."
              />
            )}
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
                  <LoaderCircle size={20} className={styles.spinner} aria-hidden="true" />
                ) : (
                  'Показать ещё'
                )}
              </button>
            )}
          </>
        )}
      </main>
    </Workspace>
  );
};
