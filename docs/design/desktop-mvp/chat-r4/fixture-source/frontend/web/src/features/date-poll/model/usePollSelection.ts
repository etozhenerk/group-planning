import { useState } from 'react';
import type { DatePoll } from '@/entities/meeting';

export const usePollSelection = (poll: DatePoll) => {
  const [draft, setDraft] = useState<string[] | null>(null);
  const selected = draft ?? poll.myOptionIds;
  const toggle = (id: string) =>
    setDraft((current) => {
      const before = current ?? poll.myOptionIds;

      return before.includes(id)
        ? before.filter((value) => value !== id)
        : poll.settings.multipleAnswers
          ? [...before, id]
          : [id];
    });

  const reset = () => setDraft(null);
  const changed = [...selected].sort().join() !== [...poll.myOptionIds].sort().join();

  return { selected, toggle, changed, reset };
};
