import { useRef } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import { InfoBody } from '@preview/ui/InfoBody';
import { InfoFooter } from '@preview/ui/InfoFooter';
import { InfoDialogs } from '@preview/ui/InfoDialogs';
import { InfoState } from '@preview/ui/InfoState';
import { useInfoModel } from '@preview/model/InfoContext';
import styles from '@preview/ui/InfoSurface/InfoSurface.module.css';
export const InfoSurface = () => {
  const m = useInfoModel(),
    trigger = useRef<HTMLButtonElement>(null);
  const withdrawn = m.answer !== 'going';
  return (
    <div className={styles.screen}>
      {withdrawn ? (
        <div className={styles.withdrawn}>
          <InfoState
            title={
              m.answer === 'maybe' ? 'Вы ответили «Возможно»' : 'Вы ответили «Не смогу»'
            }
            text="Чат доступен тем, кто подтвердил участие."
            link="../calendar-r7/frame.html?view=list"
            label="К моим встречам"
          />
        </div>
      ) : (
        <iframe
          title="Чат встречи"
          className={styles.chat}
          src="../chat-r7-avatars/frame.html"
          onLoad={m.bindChat}
        />
      )}
      <Dialog
        open={m.open && !withdrawn}
        title={
          m.child === 'share'
            ? 'Пригласить друзей'
            : m.child === 'settings'
              ? 'Настройки встречи'
              : m.child === 'response'
                ? 'Изменить ответ'
                : 'О встрече'
        }
        onClose={() => (m.child ? m.setChild(null) : m.setOpen(false))}
        chatAction
        formLayout
        returnFocus={trigger}
      >
        <div className={styles.layout} hidden={m.child !== null}>
          <div className={styles.scroll} data-testid="info-scroll">
            {m.scenario === 'error' ? (
              <InfoState
                title="Встреча не загрузилась"
                text="Не удалось получить детали встречи. Попробуйте ещё раз."
                label="Повторить загрузку"
                action={() => m.setScenario('member')}
              />
            ) : (
              <InfoBody />
            )}
          </div>
          {m.scenario !== 'error' && m.scenario !== 'loading' && <InfoFooter />}
        </div>
        <InfoDialogs />
      </Dialog>
    </div>
  );
};
