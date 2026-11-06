import { onboardingSlides } from '@/widgets/onboarding/model/onboardingSlides';
import type { useOnboarding } from '@/widgets/onboarding/model/useOnboarding';
import { OnboardingArtwork } from '@/widgets/onboarding/ui/OnboardingArtwork';
import styles from '@/widgets/onboarding/ui/OnboardingPager/OnboardingPager.module.css';

export type OnboardingPagerProps = { state: ReturnType<typeof useOnboarding> };

export const OnboardingPager = ({ state }: OnboardingPagerProps) => (
  <div
    className={styles.viewport}
    data-testid="onboarding-pager"
    onPointerDown={(event) => {
      if (!(
        event.target instanceof Element && event.target.closest('button, input, a')
      )) {
        event.currentTarget.setPointerCapture(event.pointerId);
        state.pointerDown(event.clientX, event.clientY);
      }
    }}
    onPointerMove={(event) =>
      state.pointerMove(event.clientX, event.clientY, event.currentTarget.clientWidth)
    }
    onPointerUp={(event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      state.pointerUp(event.clientX, event.clientY);
    }}
    onPointerCancel={state.pointerCancel}
    onKeyDown={(event) => {
      if (event.target instanceof Element && event.target.closest('button, input, a')) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        state.choose(state.page + (event.key === 'ArrowRight' ? 1 : -1));
      }
    }}
  >
    <div
      className={styles.track}
      data-dragging={state.drag !== 0}
      style={{
        width: `${onboardingSlides.length * 100}%`,
        transform: `translateX(calc(${(-state.page * 100) / onboardingSlides.length}% + ${state.drag}px))`,
      }}
    >
      {onboardingSlides.map((slide, index) => (
        <section
          key={slide.id}
          className={styles.slide}
          aria-hidden={index !== state.page}
          inert={index !== state.page}
          aria-label={`${index + 1} из ${onboardingSlides.length}`}
          data-testid={`onboarding-slide-${index}`}
        >
          <div
            className={styles.illustration}
            data-tall={index === 2 || index === 5}
            role={index === 1 ? 'group' : 'img'}
            aria-label={slide.illustrationAccessibleLabel}
          >
            <OnboardingArtwork page={index} active={index === state.page} />
          </div>
          <div className={styles.copy}>
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
          </div>
        </section>
      ))}
    </div>
    <span className={styles.sr} role="status">
      {state.page + 1} из {onboardingSlides.length}:{' '}
      {(onboardingSlides[state.page]?.title ?? onboardingSlides[0].title).replaceAll(
        '\n',
        ' ',
      )}
    </span>
  </div>
);
