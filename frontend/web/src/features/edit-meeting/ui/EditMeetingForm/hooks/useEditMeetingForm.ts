import { useEffect, useRef, useState } from 'react';
import { useInvalidFocus, useFormViewport } from '@/shared/lib/form';
import { useMobileLayout } from '@/shared/lib/media';
import { useEdit } from '@/features/edit-meeting/model/useEdit';
import { useSettingsExit } from '@/features/edit-meeting/model/useSettingsExit';
import type { EditMeetingFormProps } from '@/features/edit-meeting/ui/EditMeetingForm/EditMeetingForm';

export const useEditMeetingForm = ({
  meeting,
  session,
  onSaved,
  active = true,
  onRegisterClose,
  onModeChange,
  onDiscard,
}: EditMeetingFormProps) => {
  const mobile = useMobileLayout();
  const scroll = useFormViewport();
  const form = useEdit(meeting, session, onSaved);
  const formRef = useRef<HTMLFormElement>(null);
  useInvalidFocus(formRef, form.validationAttempt);
  const [reviewing, setReviewing] = useState(false);
  const exit = useSettingsExit({
    active: active && mobile,
    dirty: form.dirty && !form.forbidden,
    blocked: form.pending || form.preparing || form.uncertain,
    reviewing,
    leaveReview: () => setReviewing(false),
    register: onRegisterClose,
    discarded: onDiscard,
  });

  useEffect(() => {
    onModeChange?.(
      exit.confirm
        ? 'Выйти без сохранения?'
        : reviewing
          ? 'Проверить изменения'
          : 'Настройки встречи',
    );
  }, [exit.confirm, reviewing, onModeChange]);

  return { mobile, scroll, form, formRef, reviewing, setReviewing, exit };
};
