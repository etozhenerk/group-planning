import type { QueryClient } from '@tanstack/react-query';

export const resetSession = (client: QueryClient): void => {
  void client.cancelQueries();
  // Keep the observed session query: replacing the entire cache strands its observers.
  client.setQueryData(['session'], null);
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
};
