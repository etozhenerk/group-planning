import { sectionKey } from '@/features/support-feedback/lib/sectionKey';
import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Dialog } from '@/shared/ui/Dialog';
import { screenOptions } from '@/features/support-feedback/model/types';
import type { FeedbackScreen } from '@/features/support-feedback/model/types';
import type { useFeedback } from '@/features/support-feedback/model/useFeedback';
import styles from '@/features/support-feedback/ui/MobileFeedbackSection/MobileFeedbackSection.module.css';

export type MobileFeedbackSectionProps = { model: ReturnType<typeof useFeedback> };

export const MobileFeedbackSection = ({ model: m }: MobileFeedbackSectionProps) => {
  const [open, setOpen] = useState(false),
    trigger = useRef<HTMLButtonElement>(null);

  return (
    <div className={styles.section}>
      <span className={styles.label}>Раздел приложения</span>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={'Раздел приложения: ' + screenOptions[m.screen]}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{screenOptions[m.screen]}</span>
        <ChevronDown size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      <Dialog
        open={open}
        title="Раздел приложения"
        onClose={() => setOpen(false)}
        returnFocus={trigger}
        chatAction
      >
        <div
          className={styles.options}
          role="radiogroup"
          aria-label="Выберите раздел приложения"
        >
          {Object.entries(screenOptions).map(([value, label]) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="feedback-screen"
                value={value}
                checked={m.screen === value}
                onClick={() => {
                  if (m.screen === value) {
                    setOpen(false);
                  }
                }}
                onKeyDown={(event) =>
                  sectionKey(event, () => {
                    m.setScreen(value as FeedbackScreen);
                    setOpen(false);
                  })
                }
                onChange={() => {
                  m.setScreen(value as FeedbackScreen);
                  setOpen(false);
                }}
              />
              <span>{label}</span>
              <Check size={20} strokeWidth={1.8} aria-hidden="true" />
            </label>
          ))}
        </div>
      </Dialog>
    </div>
  );
};
