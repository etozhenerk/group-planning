import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useInfoModel } from '@preview/model/InfoContext';
import styles from '@preview/ui/InfoFooter/InfoFooter.module.css';
export const InfoFooter = () => {
  const m = useInfoModel();
  return (
    <div className={styles.footer} data-testid="info-footer">
      {m.organizer ? (
        <button
          className={styles.invite}
          onClick={(event) => m.showChild('share', event.currentTarget)}
        >
          <ChatIcon name="share" size={18} />
          Пригласить друзей
        </button>
      ) : (
        <div className={styles.response}>
          <span className={styles.check}>
            <ChatIcon name="check" size={18} />
          </span>
          <div>
            <small>Ваш ответ</small>
            <strong>Приду</strong>
          </div>
          <button onClick={(event) => m.showChild('response', event.currentTarget)}>
            Изменить <ChatIcon name="down" size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
