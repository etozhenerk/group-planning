import { useState } from 'react';
import { MeetingCard } from '@/entities/meeting';
import { CalendarGrid } from '@/entities/meeting';
import {
  exampleMeeting,
  exampleCoffee,
  exampleCalendar,
  ignoreExampleAction,
} from '@/widgets/onboarding/model/examples';
import styles from '@/widgets/onboarding/ui/OnboardingPlans/OnboardingPlans.module.css';

export const OnboardingPlans = () => {
  const [calendar, setCalendar] = useState(false);

  return (
    <div className={styles.plans}>
      <div className={styles.switcher} aria-label="Вид примера встреч">
        <button type="button" aria-pressed={!calendar} onClick={() => setCalendar(false)}>
          Список
        </button>
        <button type="button" aria-pressed={calendar} onClick={() => setCalendar(true)}>
          Календарь
        </button>
      </div>
      <div inert>
        {calendar ? (
          <CalendarGrid
            day="2026-11-07"
            currentDay="2026-11-03"
            page={exampleCalendar}
            onSelect={ignoreExampleAction}
          />
        ) : (
          <>
            <MeetingCard
              meeting={exampleMeeting}
              user="misha"
              coverPreview={
                <img className={styles.cover} src="/onboarding/boardgame.png" alt="" />
              }
            />
            <MeetingCard meeting={exampleCoffee} user="misha" />
          </>
        )}
      </div>
    </div>
  );
};
