import { Link } from 'react-router';
import { privacySections } from '@/pages/service/model/privacy';
import { CookiesContent } from '@/pages/service/ui/CookiesContent';
import styles from '@/pages/service/ui/PolicyContent/PolicyContent.module.css';

export type PolicyContentProps = { kind: 'privacy' | 'cookies' };

export const PolicyContent = ({ kind }: PolicyContentProps) => (
  <>
    <div className={styles.draft}>
      <span>Проект документа</span>
      <p>Реквизиты и условия хранения дополним перед публикацией.</p>
    </div>
    {kind === 'cookies' ? (
      <CookiesContent />
    ) : (
      <div className={styles.layout}>
        <nav className={styles.toc} aria-label="Содержание политики">
          {privacySections.map((section, index) => (
            <a key={section.key} href={`#${section.key}`}>
              {
                [
                  'Оператор',
                  'Какие данные',
                  'Для чего',
                  'Кто получает доступ',
                  'Обращения',
                  'Хранение',
                  'Ваши права',
                ][index]
              }
            </a>
          ))}
        </nav>
        <article className={styles.copy}>
          {privacySections.map((section) => (
            <section id={section.key} key={section.key}>
              <h2>{section.title}</h2>
              {section.key === 'operator' && (
                <dl className={styles.fields}>
                  {['Оператор', 'Страна и применимое право', 'Контакт для обращений'].map(
                    (label) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>Будет заполнено</dd>
                      </div>
                    ),
                  )}
                </dl>
              )}
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className={paragraph.draft ? styles.unfilled : undefined}>
                  {paragraph.text}
                </p>
              ))}
              {section.key === 'retention' && (
                <Link to="/cookies">Cookie и данные браузера →</Link>
              )}
            </section>
          ))}
        </article>
      </div>
    )}
  </>
);
