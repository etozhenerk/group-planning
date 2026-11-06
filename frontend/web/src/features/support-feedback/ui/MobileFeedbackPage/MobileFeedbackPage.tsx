import { useLayoutEffect, useRef } from 'react';
import type {
  FeedbackKind,
  FeedbackScreen,
} from '@/features/support-feedback/model/types';
import { useFeedback } from '@/features/support-feedback/model/useFeedback';
import { useFeedbackLayout } from '@/features/support-feedback/model/useFeedbackLayout';
import { MobilePageHeader } from '@/features/support-feedback/ui/MobilePageHeader/MobilePageHeader';
import { MobileFeedbackFields } from '@/features/support-feedback/ui/MobileFeedbackFields/MobileFeedbackFields';
import { MobileFeedbackOptions } from '@/features/support-feedback/ui/MobileFeedbackOptions/MobileFeedbackOptions';
import { MobileFeedbackAttachment } from '@/features/support-feedback/ui/MobileFeedbackAttachment/MobileFeedbackAttachment';
import { MobileFeedbackFooter } from '@/features/support-feedback/ui/MobileFeedbackFooter/MobileFeedbackFooter';
import { MobileFeedbackSuccess } from '@/features/support-feedback/ui/MobileFeedbackSuccess/MobileFeedbackSuccess';
import styles from '@/features/support-feedback/ui/MobileFeedbackPage/MobileFeedbackPage.module.css';

export type MobileFeedbackPageProps = { kind: FeedbackKind; screen: FeedbackScreen };

export const MobileFeedbackPage = ({ kind, screen }: MobileFeedbackPageProps) => {
  const m = useFeedback(kind, screen, true),
    layout = useFeedbackLayout(),
    body = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (body.current) {
      body.current.scrollTop = m.scroll.current;
    }
  }, [layout.pinned, m.scroll]);

  if (m.mutation.data) {
    return (
      <MobileFeedbackSuccess reference={m.mutation.data.reference} reset={m.reset} />
    );
  }

  return (
    <form
      id="main"
      className={styles.form}
      data-pinned={layout.pinned}
      onSubmit={m.submit}
      noValidate
      ref={(node) => {
        layout.root.current = node;
        m.formRef.current = node;
      }}
    >
      <div
        className={styles.body}
        ref={body}
        onScroll={(e) => {
          m.scroll.current = e.currentTarget.scrollTop;
        }}
        data-testid="feedback-scroll"
      >
        <div ref={layout.content}>
          <MobilePageHeader title="Написать в поддержку" form />
          <fieldset className={styles.fields} disabled={m.mutation.isPending || m.frozen}>
            <MobileFeedbackFields model={m} />
            <MobileFeedbackAttachment model={m} />
            <MobileFeedbackOptions model={m} />
          </fieldset>
        </div>
      </div>
      <div ref={layout.footer} className={styles.footer}>
        <MobileFeedbackFooter model={m} pinned={layout.pinned} />
      </div>
    </form>
  );
};
