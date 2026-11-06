import { OnboardingInvitation } from '@/widgets/onboarding/ui/OnboardingInvitation';
import { OnboardingPlans } from '@/widgets/onboarding/ui/OnboardingPlans';
import { OnboardingConversation } from '@/widgets/onboarding/ui/OnboardingConversation';
import { OnboardingDecision } from '@/widgets/onboarding/ui/OnboardingDecision';
import { OnboardingTask } from '@/widgets/onboarding/ui/OnboardingTask';
import { OnboardingAlbum } from '@/widgets/onboarding/ui/OnboardingAlbum';
import { MeetingCard } from '@/entities/meeting';
import { meeting } from '@/widgets/onboarding/model/artworkExamples';
import styles from '@/widgets/onboarding/ui/OnboardingArtwork/OnboardingArtwork.module.css';

export type OnboardingArtworkProps = { page: number; active: boolean };

export const OnboardingArtwork = ({ page, active }: OnboardingArtworkProps) => (
  <div className={styles.artwork} data-active={active}>
    {page === 0 && <OnboardingInvitation />}
    {page === 1 && <OnboardingPlans />}
    {page === 2 && <OnboardingConversation />}
    {(page === 3 || page === 4) && <OnboardingDecision place={page === 4} />}
    {page === 5 && <OnboardingTask />}
    {page === 6 && <OnboardingAlbum />}
    {page === 7 && (
      <div className={styles.start} inert>
        <MeetingCard
          meeting={{
            ...meeting,
            coverUrl: null,
            title: 'Ваша первая встреча',
            participantCount: 1,
            participantPreview: [{ id: 'misha', display_name: 'Миша' }],
            organizerId: 'misha',
          }}
          user="misha"
        />
      </div>
    )}
  </div>
);
