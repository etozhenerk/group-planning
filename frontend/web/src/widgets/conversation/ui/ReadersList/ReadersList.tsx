import { useEffect } from 'react';
import { useReaders } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { Skeleton } from '@/shared/ui/Skeleton';
import { designTokens } from '@/shared/config/design-tokens';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/widgets/conversation/ui/ReadersList/ReadersList.module.css';

export type ReadersListProps = {
  meeting: string;
  user: string;
  entry: string;
  version: string | undefined;
  enabled: boolean;
  close: () => void;
};

export const ReadersList = ({
  meeting,
  user,
  entry,
  version,
  enabled,
  close,
}: ReadersListProps) => {
  const query = useReaders(meeting, user, entry, version, enabled);
  const mobile = useMobileLayout();
  const people = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.readers)
        .map((person) => [person.id, person]) ?? [],
    ).values(),
  ];

  useEffect(() => {
    if (query.denied) {
      close();
    }
  }, [query.denied, close]);

  return (
    <div className={styles.content} data-mobile={mobile}>
      {query.isPending && (
        <div role="status" aria-label="Загружаем список" className={styles.loading}>
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <Skeleton
                width={designTokens.spaceS32}
                height={Number.parseFloat(designTokens.spaceS32)}
                round
              />
              <Skeleton width="60%" />
            </div>
          ))}
        </div>
      )}
      {!!people.length && (
        <ul className={styles.list}>
          {people.map((person) => (
            <li key={person.id}>
              <Avatar
                name={person.display_name}
                src={person.avatar_url ?? null}
                size="small"
              />
              <span>{person.display_name}</span>
            </li>
          ))}
        </ul>
      )}
      {query.isSuccess && !people.length && <p role="status">Пока никто не прочитал</p>}
      {query.error && (
        <p role="status">
          Не удалось загрузить список{' '}
          <button
            type="button"
            onClick={() =>
              void (query.isFetchNextPageError && !query.expired
                ? query.fetchNextPage()
                : query.refetch())
            }
          >
            Повторить
          </button>
        </p>
      )}
      {query.hasNextPage && !query.error && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          Показать ещё
        </button>
      )}
    </div>
  );
};
