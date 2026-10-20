import { Share } from 'lucide-react';
import { Dialog } from '@/shared/ui/dialog';
import { errorText } from '@/shared/api';
import { useShare } from '@/features/share-invitation/model/useShare';

export type ShareInvitationProps = { id: string };

export const ShareInvitation = ({ id }: ShareInvitationProps) => {
  const action = useShare(id);

  return (
    <>
      <button
        type="button"
        className="share-invitation-trigger"
        onClick={action.show}
        aria-label="Пригласить друзей"
      >
        <Share aria-hidden="true" size={20} />
        Пригласить друзей
      </button>
      <Dialog open={action.open} title="Приглашение для друзей" onClose={action.close}>
        <div className="stack">
          <p className="muted">
            По ссылке видны детали и описание встречи. Переписка откроется после ответа
            «Приду».
          </p>
          {action.query.isPending && <p role="status">Получаем ссылку…</p>}
          {action.query.error && (
            <p role="alert" className="error">
              {errorText(action.query.error)}
            </p>
          )}
          {action.query.data && (
            <>
              <label>
                Ссылка приглашения
                <input
                  readOnly
                  value={action.query.data}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </label>
              <div className="row">
                <button type="button" className="primary" onClick={action.copy}>
                  Скопировать ссылку
                </button>
                {action.canShare && (
                  <button type="button" onClick={action.share}>
                    <Share size={18} aria-hidden="true" />
                    Поделиться
                  </button>
                )}
              </div>
            </>
          )}
          <p role="status" className={action.failed ? 'error' : 'muted'}>
            {action.message}
          </p>
        </div>
      </Dialog>
    </>
  );
};
