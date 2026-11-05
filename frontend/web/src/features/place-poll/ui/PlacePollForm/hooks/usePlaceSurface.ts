import { useEffect, useRef } from 'react';
import { useDraftExit, useFormViewport, useInvalidFocus } from '@/shared/lib/form';
import { useMobileLayout } from '@/shared/lib/media';
import { usePlaceForm } from '@/features/place-poll/model/usePlaceForm';
import type { PlacePollFormProps } from '@/features/place-poll/ui/PlacePollForm/PlacePollForm';

export const usePlaceSurface = (props: PlacePollFormProps) => {
  const { meeting, session, done, active, onRegisterClose, onModeChange } = props;
  const mobile = useMobileLayout();
  const form = usePlaceForm(meeting, session, done);
  const scroll = useFormViewport();
  const formRef = useRef<HTMLFormElement>(null);
  useInvalidFocus(formRef, form.attempt);
  const exit = useDraftExit({
    active: mobile && active === true,
    dirty: form.dirty,
    blocked: form.locked,
    register: onRegisterClose,
    discard: props.onDiscard ?? done,
  });

  useEffect(() => {
    if (active) {
      onModeChange?.(exit.confirm ? 'Выйти без сохранения?' : 'Предложить место');
    }
  }, [active, exit.confirm, onModeChange]);

  return { mobile, form, scroll, formRef, exit };
};
