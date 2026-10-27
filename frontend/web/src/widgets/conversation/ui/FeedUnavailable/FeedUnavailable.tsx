import type { useConversation } from '@/entities/meeting';
import { SkeletonConversation } from '@/shared/ui/SkeletonConversation';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';

export type FeedUnavailableProps = { query: ReturnType<typeof useConversation> };

export const FeedUnavailable = ({ query }: FeedUnavailableProps) => {
  if (query.access.denied) {
    return (
      <Status
        title="Переписка закрыта"
        text="Откройте приглашение, чтобы проверить или изменить ответ."
      />
    );
  }

  if (query.isPending) {
    return <SkeletonConversation />;
  }

  return (
    <Status
      title="Не удалось загрузить разговор"
      text={errorText(query.error)}
      error
      action={() => void query.refetch()}
    />
  );
};
