import { ArrowUp } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useSendMessage } from '@/features/send-message/model/useSendMessage';
import { PendingBubble } from '@/features/send-message/ui/PendingBubble';

export type SendMessageProps = { id: string; session: Session };

export const SendMessage = ({ id, session }: SendMessageProps) => {
  const action = useSendMessage(id, session);

  return (
    <div className="composer-area">
      <div className="pending-messages">
        {action.pending.map((message) => (
          <PendingBubble key={message.id} message={message} retry={action.retry} />
        ))}
      </div>
      <form className="composer" onSubmit={action.submit}>
        <label className="grow">
          <span className="sr-only">Сообщение</span>
          <textarea
            rows={1}
            maxLength={4000}
            value={action.text}
            onChange={(event) => action.setText(event.target.value)}
            onKeyDown={action.keyDown}
            placeholder="Написать сообщение…"
            disabled={action.disabled}
          />
        </label>
        <button
          type="submit"
          className="icon primary"
          aria-label="Отправить сообщение"
          disabled={!action.text.trim() || action.disabled}
        >
          <ArrowUp aria-hidden="true" size={22} />
        </button>
      </form>
    </div>
  );
};
