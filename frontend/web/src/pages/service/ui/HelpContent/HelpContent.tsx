import { HelpQuestion } from '@/pages/service/ui/HelpQuestion';
import { Link, useLocation } from 'react-router';
import { readReturnLocation } from '@/shared/lib/navigation';
import { serviceContent } from '@/pages/service/model/content';
import styles from '@/pages/service/ui/HelpContent/HelpContent.module.css';

export type HelpContentProps = Record<string, never>;

export const HelpContent = () => {
  const location = useLocation();
  const back = readReturnLocation(location.state);

  return (
    <>
      <div className={styles.list}>
        {serviceContent.help.sections.map(([title, text], index) => (
          <HelpQuestion
            key={title}
            title={title}
            text={text}
            initiallyOpen={index === 0}
          />
        ))}
      </div>
      <div className={styles.callout}>
        <div>
          <h2>Не нашли ответ?</h2>
          <p>Напишите, с чем нужна помощь.</p>
        </div>
        <Link
          to="/support?kind=question"
          state={{ returnTo: '/help', returnState: { returnTo: back.path } }}
        >
          Задать вопрос ↗
        </Link>
      </div>
    </>
  );
};
