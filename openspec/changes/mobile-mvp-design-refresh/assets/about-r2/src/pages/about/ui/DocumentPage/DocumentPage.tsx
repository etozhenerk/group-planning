import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { List } from "lucide-react";
import { PageBack } from "@nav/PageBack";
import { privacySections } from "@a/model/privacy";
import { cookieSections } from "@a/model/cookieSections";
import { DocumentStatus } from "@a/ui/DocumentStatus";
import { DocumentIndex } from "@a/ui/DocumentIndex";
import { PrivacyDocument } from "@a/ui/PrivacyDocument";
import { CookieDocument } from "@a/ui/CookieDocument";
import type { AboutModel } from "@a/model/useAboutPreview";
import styles from "@a/ui/DocumentPage/DocumentPage.module.css";
export type DocumentPageProps = {
  kind: "privacy" | "cookies";
  model: AboutModel;
};
export const DocumentPage = ({ kind, model: m }: DocumentPageProps) => {
  const navigate = useNavigate(),
    body = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    timer = useRef<number | undefined>(undefined),
    [open, setOpen] = useState(m.mode === "privacy-index");
  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = m.positions.current[kind] ?? 0;
    const el = body.current;
    return () => {
      if (el) m.positions.current[kind] = el.scrollTop;
    };
  }, [kind]);
  useEffect(() => () => clearTimeout(timer.current), [kind]);
  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <PageBack label="К предыдущему экрану" onClick={() => navigate(-1)} />
        <button
          ref={trigger}
          type="button"
          className={styles.contents}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <List size={20} strokeWidth={1.6} />
          Содержание
        </button>
      </header>
      <div ref={body} className={styles.body} data-testid="document-scroll">
        <h1>
          {kind === "privacy"
            ? "Политика конфиденциальности"
            : "Cookie и данные браузера"}
        </h1>
        <DocumentStatus />
        {kind === "privacy" ? <PrivacyDocument /> : <CookieDocument />}
      </div>
      <DocumentIndex
        open={open}
        close={() => setOpen(false)}
        trigger={trigger}
        items={
          kind === "privacy"
            ? privacySections.map((s) => ({
                key: "privacy-" + s.key,
                title: s.title,
              }))
            : cookieSections
        }
        choose={(key) => {
          setOpen(false);
          const target = body.current?.querySelector<HTMLElement>("#" + key);
          requestAnimationFrame(() =>
            target?.scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
                ? "instant"
                : "smooth",
              block: "start",
            }),
          );
          timer.current = window.setTimeout(() => {
            if (target?.isConnected)
              target
                .querySelector<HTMLElement>("h2")
                ?.focus({ preventScroll: true });
          }, 260);
        }}
      />
    </main>
  );
};
