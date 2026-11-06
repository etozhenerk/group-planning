import { useRef, useState, useEffect } from 'react';
import { useDocumentBack } from '@/pages/service/model/useDocumentBack';
import { designTokens } from '@/shared/config/design-tokens';
import { List } from 'lucide-react';
import { PageBack } from '@/shared/ui/PageBack';
import { privacySections } from '@/pages/service/model/privacy';
import { cookieSections } from '@/pages/service/model/cookieSections';
import { useDocumentPosition } from '@/pages/service/model/useDocumentPosition';
import { MobileDocumentStatus } from '@/pages/service/ui/MobileDocumentStatus';
import { MobileDocumentIndex } from '@/pages/service/ui/MobileDocumentIndex';
import { MobilePrivacyDocument } from '@/pages/service/ui/MobilePrivacyDocument';
import { MobileCookieDocument } from '@/pages/service/ui/MobileCookieDocument';
import styles from '@/pages/service/ui/MobileDocument/MobileDocument.module.css';

export type MobileDocumentProps = { kind: 'privacy' | 'cookies' };

export const MobileDocument = ({ kind }: MobileDocumentProps) => {
  const { back, onClick } = useDocumentBack();
  const body = useDocumentPosition(kind),
    trigger = useRef<HTMLButtonElement>(null),
    timer = useRef<number | undefined>(undefined),
    [open, setOpen] = useState(false);

  useEffect(() => () => clearTimeout(timer.current), [kind]);
  const choose = (key: string) => {
    setOpen(false);
    const target = body.current?.querySelector<HTMLElement>('#' + key);
    requestAnimationFrame(() =>
      target?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion:reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      }),
    );
    timer.current = window.setTimeout(() => {
      if (target?.isConnected) {
        target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      }
    }, Number.parseFloat(designTokens.motionDurationNavigation));
  };

  return (
    <main id="main" className={styles.page}>
      <header className={styles.bar}>
        <PageBack
          to={back.path}
          state={back.state}
          label="К предыдущему экрану"
          onClick={onClick}
        />
        <button
          ref={trigger}
          type="button"
          className={styles.contents}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <List
            aria-hidden="true"
            strokeWidth={Number.parseFloat(
              designTokens.componentMobileUnreadIconStrokeWidth,
            )}
          />
          Содержание
        </button>
      </header>
      <div ref={body} className={styles.body} data-testid="document-scroll">
        <h1>
          {kind === 'privacy'
            ? 'Политика конфиденциальности'
            : 'Cookie и данные браузера'}
        </h1>
        <MobileDocumentStatus />
        {kind === 'privacy' ? <MobilePrivacyDocument /> : <MobileCookieDocument />}
      </div>
      <MobileDocumentIndex
        open={open}
        close={() => setOpen(false)}
        trigger={trigger}
        items={
          kind === 'privacy'
            ? privacySections.map((s) => ({ key: 'privacy-' + s.key, title: s.title }))
            : cookieSections
        }
        choose={choose}
      />
    </main>
  );
};
