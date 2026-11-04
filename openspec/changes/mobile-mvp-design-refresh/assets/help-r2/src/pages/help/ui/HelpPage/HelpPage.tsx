import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@h/ui/PageHeader";
import { HelpQuestion } from "@h/ui/HelpQuestion";
import { serviceContent } from "@h/model/content";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/HelpPage/HelpPage.module.css";
export type HelpPageProps = { model: HelpModel };
export const HelpPage = ({ model: m }: HelpPageProps) => {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = m.scroll.current;
    const el = ref.current;
    return () => {
      if (el) m.scroll.current = el.scrollTop;
    };
  }, []);
  return (
    <main ref={ref} className={styles.page}>
      <PageHeader title="Помощь" />
      <div className={styles.content}>
        <section aria-label="Вопросы и ответы" className={styles.questions}>
          {serviceContent.help.sections.map(([title, text], i) => (
            <HelpQuestion
              key={title}
              title={title}
              text={text}
              open={m.opened.includes(i)}
              toggle={() =>
                m.setOpened(
                  m.opened.includes(i)
                    ? m.opened.filter((n) => n !== i)
                    : [...m.opened, i],
                )
              }
            />
          ))}
        </section>
        <section className={styles.contact}>
          <MessageCircle size={24} strokeWidth={1.6} />
          <h2>Остался вопрос?</h2>
          <Link to="/support" onClick={() => m.setKind("question")}>
            Написать в поддержку
            <ArrowUpRight size={18} />
          </Link>
        </section>
      </div>
    </main>
  );
};
