import { useOpenDeletion } from '@/features/delete-account/model/context';
import styles from '@/features/delete-account/ui/DeleteAccountButton/DeleteAccountButton.module.css';

export type DeleteAccountButtonProps = { csrf: string | null };

export const DeleteAccountButton = ({ csrf }: DeleteAccountButtonProps) => {
  const open = useOpenDeletion();

  return (
    <button type="button" className={styles.danger} onClick={() => open(csrf)}>
      Удалить аккаунт
    </button>
  );
};
