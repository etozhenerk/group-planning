import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { useEdit } from '@/features/edit-meeting/model/useEdit';
import styles from '@/features/edit-meeting/ui/DesktopSettingsSubmit/DesktopSettingsSubmit.module.css';

export type DesktopSettingsSubmitProps = { form: ReturnType<typeof useEdit> };

export const DesktopSettingsSubmit = ({ form }: DesktopSettingsSubmitProps) => (
  <>
    <button
      type="submit"
      className={styles.primary}
      disabled={form.pending || form.preparing || form.conflict}
      aria-busy={form.pending}
      aria-label={form.uncertain ? 'Повторить отправку' : 'Сохранить изменения'}
    >
      {form.pending ? (
        <ButtonSpinner />
      ) : form.uncertain ? (
        'Повторить отправку'
      ) : (
        'Сохранить изменения'
      )}
    </button>
  </>
);
