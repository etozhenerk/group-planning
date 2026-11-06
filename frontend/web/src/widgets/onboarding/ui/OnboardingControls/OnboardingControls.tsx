import type { useOnboarding } from '@/widgets/onboarding/model/useOnboarding';
import { OnboardingProgress } from '@/widgets/onboarding/ui/OnboardingProgress';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/widgets/onboarding/ui/OnboardingControls/OnboardingControls.module.css';

export type OnboardingControlsProps = { state: ReturnType<typeof useOnboarding> };

export const OnboardingControls = ({ state }: OnboardingControlsProps) => (
  <div className={styles.controls}>
    <OnboardingProgress page={state.page} disabled={state.busy} choose={state.choose} />
    <div className={styles.actions} data-last={state.page === state.last}>
      <button
        type="button"
        className={styles.back}
        aria-label="Предыдущий слайд"
        data-hidden={state.page === 0}
        tabIndex={state.page === 0 ? -1 : undefined}
        disabled={state.busy}
        onClick={() => state.choose(state.page - 1)}
      >
        <ChatIcon name="left" />
      </button>
      <button
        type="button"
        className={styles.next}
        disabled={state.busy}
        aria-busy={state.busy}
        aria-label={state.page === state.last ? 'Войти через Яндекс ID' : 'Далее'}
        onClick={() =>
          state.page === state.last ? state.signIn() : state.choose(state.page + 1)
        }
      >
        <span aria-hidden={state.busy}>
          {state.page === state.last ? 'Войти через Яндекс ID' : 'Далее'}
          <ChatIcon name="right" />
        </span>
        {state.busy && (
          <span className={styles.spinner}>
            <ButtonSpinner />
          </span>
        )}
      </button>
    </div>
  </div>
);
