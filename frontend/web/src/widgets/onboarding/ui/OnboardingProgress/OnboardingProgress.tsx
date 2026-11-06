import styles from '@/widgets/onboarding/ui/OnboardingProgress/OnboardingProgress.module.css';
import { onboardingSlides } from '@/widgets/onboarding/model/onboardingSlides';

export type OnboardingProgressProps = {
  page: number;
  disabled: boolean;
  choose: (page: number) => void;
};

export const OnboardingProgress = ({
  page,
  disabled,
  choose,
}: OnboardingProgressProps) => (
  <div className={styles.progress}>
    <div className={styles.dots} aria-hidden="true">
      {onboardingSlides.map((slide, index) => (
        <span key={slide.id} className={styles.slot}>
          <i data-selected={page === index} />
        </span>
      ))}
    </div>
    <input
      type="range"
      min={0}
      max={onboardingSlides.length - 1}
      step={1}
      value={page}
      disabled={disabled}
      aria-label="Страница знакомства"
      aria-valuetext={`${page + 1} из ${onboardingSlides.length}`}
      onChange={(event) => choose(Number(event.target.value))}
    />
  </div>
);
