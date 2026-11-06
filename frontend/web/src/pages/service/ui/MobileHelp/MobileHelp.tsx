import { useLayoutEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';
import { MessageCircle, ArrowUpRight } from 'lucide-react';
import { PageBack } from '@/shared/ui/PageBack';
import { readReturnLocation, returnLocationLabel } from '@/shared/lib/navigation';
import { useSession } from '@/entities/session';
import { HelpQuestion } from '@/pages/service/ui/HelpQuestion';
import { serviceContent } from '@/pages/service/model/content';
import styles from '@/pages/service/ui/MobileHelp/MobileHelp.module.css';

export type MobileHelpProps = Record<string, never>;

export const MobileHelp = () => {
  const location = useLocation(),
    back = readReturnLocation(location.state, '/profile'),
    client = useQueryClient(),
    session = useSession();

  const key = ['mobile-help', session.data?.user.id ?? 'anonymous'];
  const { data: state } = useQuery({
    queryKey: key,
    queryFn: () => ({ opened: [0], scroll: 0 }),
    initialData: { opened: [0], scroll: 0 },
    enabled: false,
    gcTime: Infinity,
  });

  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = state.scroll;
    }
  }, [state.scroll]);

  return (
    <main
      id="main"
      ref={ref}
      className={styles.page}
      onScroll={(e) =>
        client.setQueryData(key, { ...state, scroll: e.currentTarget.scrollTop })
      }
    >
      <header className={styles.header}>
        <PageBack
          to={back.path}
          state={back.state}
          label={returnLocationLabel(back.path)}
        />
        <h1>Помощь</h1>
      </header>
      <div className={styles.content}>
        <section aria-label="Вопросы и ответы" className={styles.questions}>
          {serviceContent.help.sections.map(([title, text], i) => (
            <HelpQuestion
              key={title}
              title={title}
              text={text}
              initiallyOpen={i === 0}
              expanded={state.opened.includes(i)}
              toggle={() =>
                client.setQueryData(key, {
                  ...state,
                  opened: state.opened.includes(i)
                    ? state.opened.filter((n) => n !== i)
                    : [...state.opened, i],
                })
              }
            />
          ))}
        </section>
        <section className={styles.contact}>
          <MessageCircle aria-hidden="true" />
          <h2>Остался вопрос?</h2>
          <Link
            to="/support?kind=question"
            state={{ returnTo: '/help', returnState: { returnTo: back.path } }}
          >
            Написать в поддержку
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
};
