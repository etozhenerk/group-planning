import { useEffect, useState } from 'react';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';

export const useActionCompletion = (
  kind: ConversationActionKind,
  open: boolean,
  done: () => void,
) => {
  const [generation, setGeneration] = useState({ date: 0, place: 0, task: 0 });
  const [completed, setCompleted] = useState<('date' | 'place' | 'task')[]>([]);
  useEffect(() => {
    // Dialog retains the open child until its exit animation finishes.
    if (!open && completed.length > 0) {
      setGeneration((value) => {
        const next = { ...value };

        for (const form of completed) {
          next[form]++;
        }

        return next;
      });
      setCompleted([]);
    }
  }, [open, completed]);

  return {
    generation,
    complete: (form: 'date' | 'place' | 'task') => {
      setCompleted((value) => (value.includes(form) ? value : [...value, form]));

      if (open && kind === form) {
        done();
      }
    },
  };
};
