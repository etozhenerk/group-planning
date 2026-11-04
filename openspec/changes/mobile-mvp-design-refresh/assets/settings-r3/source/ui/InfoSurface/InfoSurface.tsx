import { useRef } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import { InfoBody } from '@preview/ui/InfoBody';
import { InfoFooter } from '@preview/ui/InfoFooter';
import { InfoDialogs } from '@preview/ui/InfoDialogs';
import { useInfoModel } from '@preview/model/InfoContext';
import styles from '@preview/ui/InfoSurface/InfoSurface.module.css';
export const InfoSurface = () => {
  const m = useInfoModel(),
    trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className={styles.screen}>
      <iframe
        title="Чат встречи"
        className={styles.chat}
        src="../chat-r7-avatars/frame.html"
        onLoad={m.bindChat}
      />
      <Dialog
        open={m.open}
        title={
          m.guard
            ? 'Выйти без сохранения?'
            : m.child === 'share'
              ? 'Пригласить друзей'
              : m.child === 'settings'
                ? 'Настройки встречи'
                : m.child === 'response'
                  ? 'Изменить ответ'
                  : 'О встрече'
        }
        onClose={() =>
          m.child === 'settings'
            ? m.requestBack()
            : m.child
              ? m.setChild(null)
              : m.setOpen(false)
        }
        chatAction
        formLayout
        returnFocus={trigger}
      >
        <div className={styles.layout} hidden={m.child !== null}>
          <div className={styles.scroll} data-testid="info-scroll">
            {m.saved && (
              <div role="status" className={styles.saved}>
                Изменения сохранены
              </div>
            )}
            <InfoBody />
          </div>
          <InfoFooter />
        </div>
        <InfoDialogs />
      </Dialog>
    </div>
  );
};
