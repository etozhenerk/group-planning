import { ActionNotice } from '@/shared/ui/ActionNotice';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { useEdit } from '@/features/edit-meeting/model/useEdit';
import styles from '@/features/edit-meeting/ui/SettingsSubmit/SettingsSubmit.module.css';

export type SettingsSubmitProps = {
  form: ReturnType<typeof useEdit>;
  review: () => void;
  mobile: boolean;
  reviewing: boolean;
  resume: () => void;
};

export const SettingsSubmit = ({
  form,
  review,
  mobile,
  reviewing,
  resume,
}: SettingsSubmitProps) => (
  <>
    {reviewing ? (
      <button
        className={styles.primary}
        type="button"
        disabled={!form.rebaseReady}
        onClick={resume}
      >
        Продолжить с моими правками
      </button>
    ) : form.conflict ? (
      <>
        <ActionNotice title="Встреча изменилась" text="Проверьте обновлённые данные" />
        <button className={styles.primary} type="button" onClick={review}>
          Проверить изменения
        </button>
      </>
    ) : (
      <>
        {form.problem && !form.errors.title && (
          <ActionNotice
            title={form.uncertain ? 'Сохранение не подтверждено' : 'Не удалось сохранить'}
            text={
              form.uncertain
                ? 'Повторите отправку — данные менять не нужно'
                : 'Ваши правки остались в форме'
            }
          />
        )}
        <button
          type="submit"
          className={styles.primary}
          disabled={form.pending || form.preparing || !form.dirty}
          aria-busy={form.pending}
        >
          {form.pending ? (
            <ButtonSpinner />
          ) : form.uncertain ? (
            'Повторить отправку'
          ) : form.problem && !form.errors.title ? (
            'Попробовать снова'
          ) : mobile ? (
            'Сохранить'
          ) : (
            'Сохранить изменения'
          )}
        </button>
      </>
    )}
  </>
);
