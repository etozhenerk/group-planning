import { useEffect } from 'react';
import { useDraftExit } from '@/shared/lib/form';
import type { PollCreateFormProps } from '@/features/date-poll/ui/PollCreateForm/PollCreateForm';

export const usePollExit = (
  props: PollCreateFormProps,
  mobile: boolean,
  dirty: boolean,
  blocked: boolean,
) => {
  const { onModeChange, active } = props;
  const exit = useDraftExit({
    active: mobile && props.active === true,
    dirty,
    blocked,
    register: props.onRegisterClose,
    discard: props.onDiscard ?? props.done,
  });

  useEffect(() => {
    if (active) {
      onModeChange?.(exit.confirm ? 'Выйти без сохранения?' : 'Предложить дату');
    }
  }, [active, exit.confirm, onModeChange]);

  return exit;
};
