import { Link } from "react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@h/ui/PageHeader";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/FeedbackSuccess/FeedbackSuccess.module.css";
export type FeedbackSuccessProps = { model: HelpModel };
export const FeedbackSuccess = ({ model: m }: FeedbackSuccessProps) => (
  <main className={styles.page}>
    <PageHeader title="Поддержка" backLabel="К помощи" />
    <section className={styles.receipt}>
      <div className={styles.icon}>
        <Check size={28} strokeWidth={1.7} />
      </div>
      <h2>Обращение принято</h2>
      <p>Номер обращения</p>
      <strong className={styles.number}>DEMO-01</strong>
      <Link to="/help" onClick={m.reset}>
        К помощи
      </Link>
    </section>
  </main>
);
