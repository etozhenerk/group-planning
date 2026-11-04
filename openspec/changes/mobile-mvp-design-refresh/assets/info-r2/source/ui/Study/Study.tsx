import { Stage } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage';
import { Phone } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone';
import styles from '@preview/ui/Study/Study.module.css';
export const Study = () => {
  const initial = new URLSearchParams(location.search).get('state') ?? 'member';
  return (
    <div className={styles.study}>
      <Stage
        width={390}
        height={815}
        compact={{ below: 390, width: 358, height: 760 }}
        theme="dark"
        fidelity="realistic"
        className={styles.stage}
      >
        {(_s, _r, layout) => (
          <Phone
            width={layout === 'compact' ? 326 : 358}
            frame="pro"
            dark
            wallpaper="#24252a"
            className={styles.phone}
          >
            <iframe
              title="Информация о встрече"
              src={`frame.html?state=${initial}`}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
            />
          </Phone>
        )}
      </Stage>
      <div className={styles.controls}>
        <label>
          Состояние{' '}
          <select
            aria-label="Состояние информации о встрече"
            defaultValue={initial}
            onChange={(event) =>
              document
                .querySelector<HTMLIFrameElement>('iframe')
                ?.contentWindow?.postMessage(
                  { type: 'info-preview-state', value: event.target.value },
                  location.origin,
                )
            }
          >
            <option value="member">Участник</option>
            <option value="organizer">Организатор</option>
            <option value="many">30 ответов</option>
            <option value="long">Длинные данные</option>
            <option value="no-cover">Без обложки</option>
            <option value="no-time">Без времени</option>
            <option value="roster-error">Ошибка загрузки ответов</option>
            <option value="roster-loading">Загрузка ответов</option>
            <option value="response-error">Ошибка изменения ответа</option>
            <option value="organizer-share-error">Ошибка ссылки приглашения</option>
            <option value="error">Ошибка загрузки встречи</option>
            <option value="loading">Загрузка</option>
          </select>
        </label>
      </div>
      <p className={styles.controls}>Прототип · ответы и изменения локальные</p>
    </div>
  );
};
