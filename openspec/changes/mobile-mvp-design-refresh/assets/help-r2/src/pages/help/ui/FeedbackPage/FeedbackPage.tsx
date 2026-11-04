import { useLayoutEffect, useRef } from "react";
import { PageHeader } from "@h/ui/PageHeader";
import { FeedbackFields } from "@h/ui/FeedbackFields";
import { FeedbackAttachment } from "@h/ui/FeedbackAttachment";
import { FeedbackOptions } from "@h/ui/FeedbackOptions";
import { FeedbackFooter } from "@h/ui/FeedbackFooter";
import { FeedbackSuccess } from "@h/ui/FeedbackSuccess";
import { usePinnedFooter } from "@h/model/usePinnedFooter";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/FeedbackPage/FeedbackPage.module.css";
export type FeedbackPageProps = { model: HelpModel };
export const FeedbackPage = ({ model: m }: FeedbackPageProps) => {
  const layout = usePinnedFooter();
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = m.feedbackScroll.current;
  }, [layout.pinned]);
  if (m.phase === "success") return <FeedbackSuccess model={m} />;
  return (
    <form
      className={styles.form}
      data-pinned={layout.pinned}
      onSubmit={m.submit}
      noValidate
    >
      <div
        className={styles.body}
        ref={body}
        onScroll={(e) => {
          m.feedbackScroll.current = e.currentTarget.scrollTop;
        }}
        data-testid="feedback-scroll"
      >
        <div ref={layout.content}>
          <PageHeader title="Написать в поддержку" form />
          <fieldset className={styles.fields} disabled={m.phase === "sending"}>
            <FeedbackFields model={m} />
            <FeedbackAttachment model={m} />
            <FeedbackOptions model={m} />
          </fieldset>
        </div>
      </div>
      <div ref={layout.footer} className={styles.footer}>
        <FeedbackFooter model={m} pinned={layout.pinned} />
      </div>
    </form>
  );
};
