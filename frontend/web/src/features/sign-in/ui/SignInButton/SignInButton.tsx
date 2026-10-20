import styles from '@/features/sign-in/ui/SignInButton/SignInButton.module.css';
import { ArrowRight } from 'lucide-react';
import { useSignIn } from '@/features/sign-in/model/useSignIn';
import type { ReturnContext } from '@/features/sign-in/model/useSignIn';
import { errorText } from '@/shared/api';

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

  return (
    <div className={compact ? styles['compact'] : ''}>
      <button
        type="button"
        className={primary ? styles['primary'] : ''}
        onClick={() => action.mutate()}
        disabled={action.isPending}
      >
        {action.isPending ? 'Переходим ко входу…' : label}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      {action.error && (
        <p className={styles['error']} role="alert">
          {errorText(action.error)}
        </p>
      )}
    </div>
  );
};
