import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useComposer } from '@/features/send-message/ui/SendMessage/hooks/useComposer';
import { EmojiPicker } from '@/shared/ui/EmojiPicker';
import { EmojiDock } from '@/shared/ui/EmojiDock';
import styles from '@/features/send-message/ui/SendMessage/SendMessage.module.css';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/session';

export type SendMessageProps = {
  id: string;
  session: Session;
  extraAction?: ReactNode;
  emojiOpen?: boolean;
  toggleEmoji?: () => void;
};

export const SendMessage = ({
  id,
  session,
  extraAction,
  emojiOpen = false,
  toggleEmoji,
}: SendMessageProps) => {
  const { mobile, compact, action, emoji, panel, presence, togglePanel } = useComposer(
    id,
    session,
    emojiOpen,
    toggleEmoji,
  );

  return (
    <div
      className={styles['composer-area']}
      ref={panel.root}
      data-mobile={mobile}
      data-compact={compact}
    >
      {action.storageError && (
        <p role="alert">Не удалось сохранить сообщение на устройстве</p>
      )}
      {presence.visible && !mobile && (
        <div className={styles.panel} {...presence.props}>
          <EmojiPicker onSelect={emoji.insert} onClose={toggleEmoji} />
        </div>
      )}
      <form className={styles['composer-row']} onSubmit={action.submit}>
        {extraAction}
        <div className={styles['composer']}>
          <label className={styles['grow']}>
            <span className={styles['sr-only']}>Сообщение</span>
            <textarea
              aria-label="Сообщение"
              ref={emoji.input}
              onSelect={emoji.remember}
              onBlur={emoji.remember}
              onPointerDown={() => {
                if (emojiOpen) {
                  toggleEmoji?.();
                }
              }}
              rows={1}
              maxLength={4000}
              value={action.text}
              onChange={(event) => action.setText(event.target.value)}
              onKeyDown={action.keyDown}
              placeholder="Сообщение…"
              disabled={action.disabled}
            />
          </label>
          <button
            type="button"
            className={styles.icon}
            aria-label={emojiOpen ? 'Вернуться к клавиатуре' : 'Выбрать эмодзи'}
            ref={panel.trigger}
            data-chat-surface-trigger
            aria-expanded={emojiOpen}
            onClick={togglePanel}
          >
            <ChatIcon name={emojiOpen ? 'keyboard' : 'smile'} />
          </button>
        </div>
        <button
          type="submit"
          className={[styles['icon'], styles['primary']].join(' ')}
          aria-label="Отправить сообщение"
          disabled={!action.text.trim() || action.disabled}
        >
          <ChatIcon name="send" aria-hidden="true" size={22} />
        </button>
      </form>
      {presence.visible && mobile && (
        <div className={styles.dock} {...presence.props}>
          <EmojiDock composer onSelect={emoji.insert} onErase={emoji.erase} />
        </div>
      )}
    </div>
  );
};
