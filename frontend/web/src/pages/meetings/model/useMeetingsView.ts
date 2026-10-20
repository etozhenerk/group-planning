import { useMeetings } from '@/entities/meeting';

export const useMeetingsView = (user: string) => {
  const query = useMeetings(user);
  const empty =
    query.isSuccess && query.data.pages.every((page) => page.meetings.length === 0);

  return { query, empty };
};
