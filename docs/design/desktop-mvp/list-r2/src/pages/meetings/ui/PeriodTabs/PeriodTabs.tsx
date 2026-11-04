import styles from "@list/pages/meetings/ui/PeriodTabs/PeriodTabs.module.css";

export type PeriodTabsProps = {
  value: "upcoming" | "past";
  counts: { upcoming: number; past: number };
  unknown: boolean;
  onChange: (value: "upcoming" | "past") => void;
};

export const PeriodTabs = ({
  value,
  counts,
  unknown,
  onChange,
}: PeriodTabsProps) => (
  <nav
    className={styles.tabs}
    aria-label="Период встреч"
    data-past={value === "past"}
  >
    <span className={styles.indicator} aria-hidden="true" />
    {(["upcoming", "past"] as const).map((period) => (
      <button
        key={period}
        type="button"
        aria-pressed={value === period}
        onClick={() => onChange(period)}
      >
        <span className={styles.label}>
          {period === "upcoming" ? "Предстоящие" : "Прошедшие"}
        </span>
        <span
          className={styles.count}
          data-unknown={unknown}
          aria-hidden={unknown}
        >
          {unknown ? "\u00a0" : counts[period]}
        </span>
      </button>
    ))}
  </nav>
);
