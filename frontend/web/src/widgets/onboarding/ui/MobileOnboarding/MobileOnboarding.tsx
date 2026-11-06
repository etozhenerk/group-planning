import { isDemo } from '@/shared/config';
import { Brand } from '@/shared/ui/Brand';
import { AuthNotice } from '@/features/sign-in';
import { ActionNotice } from '@/shared/ui/ActionNotice';
import { useOnboardingHeader } from '@/widgets/onboarding/model/useOnboardingHeader';
import { useOnboarding } from '@/widgets/onboarding/model/useOnboarding';
import { OnboardingPager } from '@/widgets/onboarding/ui/OnboardingPager';
import { OnboardingControls } from '@/widgets/onboarding/ui/OnboardingControls';
import styles from '@/widgets/onboarding/ui/MobileOnboarding/MobileOnboarding.module.css';

export const MobileOnboarding = () => {
  const state = useOnboarding();
  const header = useOnboardingHeader();

  return (
    <main
      id="main"
      className={styles.surface}
      data-testid="mobile-onboarding"
      data-demo={isDemo}
    >
      <header className={styles.header} ref={header.ref} data-stacked={header.stacked}>
        <div inert={state.busy}>
          <Brand variant="mobile" />
        </div>
        <button
          type="button"
          className={styles.skip}
          disabled={state.busy}
          aria-hidden={state.page === state.last}
          tabIndex={state.page === state.last ? -1 : undefined}
          data-hidden={state.page === state.last}
          onClick={() => state.choose(state.last)}
        >
          Пропустить
        </button>
      </header>
      <OnboardingPager state={state} />
      <footer className={styles.footer}>
        {state.page === state.last && <AuthNotice />}
        {!!state.error && (
          <ActionNotice title="Не удалось открыть вход" text="Попробуйте ещё раз." />
        )}
        <OnboardingControls state={state} />
      </footer>
    </main>
  );
};
