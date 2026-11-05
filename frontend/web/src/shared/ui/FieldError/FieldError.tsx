import styles from '@/shared/ui/FieldError/FieldError.module.css';
import { TriangleAlert } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';

export type FieldErrorProps = { id: string; error: string; decorated?: boolean };

export const FieldError = ({ id, error, decorated = false }: FieldErrorProps) =>
  error ? (
    <p id={id} role="alert" className={styles.error} data-decorated={decorated}>
      {decorated && (
        <TriangleAlert
          size={designTokens.componentMobileCreationHintIconSize}
          strokeWidth={designTokens.componentIconStrokeWidth}
          aria-hidden="true"
        />
      )}
      <span>{error}</span>
    </p>
  ) : null;
