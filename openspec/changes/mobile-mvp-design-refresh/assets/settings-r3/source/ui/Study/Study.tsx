import { Stage } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage';
import { Phone } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone';
import styles from '@preview/ui/Study/Study.module.css';
export const Study = () => {
  const initial = new URLSearchParams(location.search).get('state') ?? 'ready';
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
              title="Настройки встречи"
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
            aria-label="Состояние настроек встречи"
            defaultValue={initial}
            onChange={(event) =>
              document
                .querySelector<HTMLIFrameElement>('iframe')
                ?.contentWindow?.postMessage(
                  { type: 'settings-preview-state', value: event.target.value },
                  location.origin,
                )
            }
          >
            <option value="ready">Настройки встречи</option>
            <option value="save-error">Ошибка сохранения</option>
            <option value="uncertain">Неизвестный результат</option>
            <option value="conflict">Данные обновились</option>
            <option value="validation">Ошибки полей</option>
            <option value="no-cover">Без обложки</option>
            <option value="no-time">Без времени</option>
            <option value="saving">Сохранение</option>
            <option value="denied">Нет прав</option>
          </select>
        </label>
      </div>
      <p className={styles.controls}>Прототип · изменения сохраняются локально</p>
    </div>
  );
};
