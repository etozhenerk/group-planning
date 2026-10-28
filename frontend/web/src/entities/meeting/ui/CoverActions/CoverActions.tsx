import { ImagePlus } from 'lucide-react';
import styles from '@/entities/meeting/ui/CoverActions/CoverActions.module.css';

export type CoverActionsProps = {
  compact: boolean;
  prominent: boolean;
  hasPhoto: boolean;
  disabled: boolean;
  choose: () => void;
  remove: () => void;
};

export const CoverActions = ({
  compact,
  prominent,
  hasPhoto,
  disabled,
  choose,
  remove,
}: CoverActionsProps) => (
  <div className={styles.actions} data-compact={compact} data-prominent={prominent}>
    <button type="button" disabled={disabled} onClick={choose}>
      {prominent && <ImagePlus size={20} aria-hidden="true" />}
      {hasPhoto ? 'Заменить' : 'Добавить фото'}
    </button>
    {hasPhoto && (
      <button type="button" disabled={disabled} onClick={remove}>
        Убрать фото
      </button>
    )}
  </div>
);
