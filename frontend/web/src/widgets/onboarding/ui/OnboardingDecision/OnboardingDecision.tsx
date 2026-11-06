import { DatePollPresentation as DatePollCard } from '@/features/date-poll';
import { PlacePollPresentation as PlacePollCard } from '@/features/place-poll';
import { datePoll, placePoll, session } from '@/widgets/onboarding/model/artworkExamples';

export type OnboardingDecisionProps = { place: boolean };

export const OnboardingDecision = ({ place }: OnboardingDecisionProps) => (
  <div inert>
    {place ? (
      <PlacePollCard
        poll={placePoll}
        session={session}
        author="Лена"
        occurredAt="2026-11-03T15:45:00Z"
        zone="Europe/Moscow"
        now={Date.parse('2026-11-03T15:45:00Z')}
      />
    ) : (
      <DatePollCard
        poll={datePoll}
        session={session}
        outgoing={false}
        zone="Europe/Moscow"
        now={Date.parse('2026-11-03T15:45:00Z')}
      />
    )}
  </div>
);
