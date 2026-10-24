import styles from '@/features/sign-in/ui/SignInButton/SignInButton.module.css';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useId } from 'react';
import { useSignIn } from '@/features/sign-in/model/useSignIn';
import type { ReturnContext } from '@/features/sign-in/model/useSignIn';

export type SignInButtonProps = {
  context: ReturnContext;
  label?: string;
  primary?: boolean;
  compact?: boolean;
};

export const SignInButton = ({
  context,
  label = 'Войти через Яндекс ID',
  primary = true,
  compact = false,
}: SignInButtonProps) => {
  const action = useSignIn(context);
  const errorId = useId();

  return (
    <div className={compact ? styles['compact'] : ''}>
      <button
        type="button"
        className={[styles['button'], primary ? styles['primary'] : ''].join(' ')}
        onClick={() => action.mutate()}
        disabled={action.isBusy}
        aria-busy={action.isBusy}
        aria-label={label}
        aria-describedby={action.error ? errorId : undefined}
      >
        <span className={styles.label} aria-hidden={action.isBusy}>
          {label}
        </span>
        <ArrowRight size={18} aria-hidden="true" className={styles.arrow} />
        {action.isBusy && (
          <span className={styles.progress} aria-hidden="true">
            <LoaderCircle size={20} className={styles.spinner} />
          </span>
        )}
      </button>
      {action.error && (
        <p id={errorId} className={styles['error']} role="alert">
          Не удалось открыть вход. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
};
