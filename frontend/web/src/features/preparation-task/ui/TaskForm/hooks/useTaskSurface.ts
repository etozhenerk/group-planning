import { useEffect, useRef, useState } from 'react';
import { useDraftExit, useFormViewport, useInvalidFocus } from '@/shared/lib/form';
import { useMobileLayout } from '@/shared/lib/media';
import { useTaskForm } from '@/features/preparation-task/model/useTaskForm';
import type { TaskFormProps } from '@/features/preparation-task/ui/TaskForm/TaskForm';

export const useTaskSurface = (props: TaskFormProps) => {
  const mobile = useMobileLayout();
  const [selecting, setSelecting] = useState(false);
  const form = useTaskForm(props.meeting, props.session, props.done, props.active);
  const scroll = useFormViewport();
  const formRef = useRef<HTMLFormElement>(null);
  useInvalidFocus(formRef, form.attempt);
  const exit = useDraftExit({
    active: mobile && props.active,
    dirty: form.dirty,
    blocked: form.locked,
    nested: selecting,
    leaveNested: () => setSelecting(false),
    register: props.onRegisterClose,
    discard: props.onDiscard ?? props.done,
  });

  const { onModeChange, active } = props;
  useEffect(() => {
    if (active) {
      onModeChange?.(
        exit.confirm
          ? 'Выйти без сохранения?'
          : selecting
            ? 'Кому предложить'
            : 'Предложить задачу',
      );
    }
  }, [active, selecting, exit.confirm, onModeChange]);

  return { mobile, form, scroll, formRef, selecting, setSelecting, exit };
};
