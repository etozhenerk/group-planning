export type FeedReactionErrorProps = { retry: (() => void) | undefined };

export const FeedReactionError = ({ retry }: FeedReactionErrorProps) => (
  <p role="status">
    Не удалось обновить реакции.{' '}
    <button type="button" onClick={retry}>
      Повторить
    </button>
  </p>
);
