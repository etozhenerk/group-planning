import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dialog } from "@/shared/ui/Dialog";
import { screenOptions } from "@h/model/types";
import type { FeedbackScreen } from "@h/model/types";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/FeedbackSection/FeedbackSection.module.css";
export type FeedbackSectionProps = { model: HelpModel };
export const FeedbackSection = ({ model: m }: FeedbackSectionProps) => {
  const [open, setOpen] = useState(m.mode === "form-section"),
    trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className={styles.section}>
      <span className={styles.label}>Раздел приложения</span>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={"Раздел приложения: " + screenOptions[m.screen]}
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
                  if (m.screen === value) setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    m.setScreen(value as FeedbackScreen);
                    setOpen(false);
                  } else if (
                    [
                      "ArrowUp",
                      "ArrowDown",
                      "ArrowLeft",
                      "ArrowRight",
                      "Home",
                      "End",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                    const inputs = Array.from(
                      e.currentTarget
                        .closest('[role="radiogroup"]')
                        ?.querySelectorAll<HTMLInputElement>("input") ?? [],
                    );
                    const step =
                      e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? inputs.length - 1
                          : (inputs.indexOf(e.currentTarget) +
                              step +
                              inputs.length) %
                            inputs.length;
                    inputs[next]?.focus();
                  }
                }}
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
