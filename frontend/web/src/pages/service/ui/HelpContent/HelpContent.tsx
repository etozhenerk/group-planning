import { Link } from 'react-router';
import { serviceContent } from '@/pages/service/model/content';
import styles from '@/pages/service/ui/HelpContent/HelpContent.module.css';

export type HelpContentProps = Record<string, never>;

export const HelpContent = () => (
  <>
    <div className={styles.list}>
      {serviceContent.help.sections.map(([title, text], index) => (
        <details key={title} open={index === 0}>
          <summary>{title}</summary>
          <p>{text}</p>
        </details>
      ))}
    </div>
    <div className={styles.callout}>
      <div>
        <h2>Не нашли ответ?</h2>
        <p>Напишите, с чем нужна помощь.</p>
      </div>
      <Link to="/support?kind=question">Задать вопрос ↗</Link>
    </div>
  </>
);
