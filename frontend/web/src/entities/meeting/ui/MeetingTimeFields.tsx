import type { MeetingDraft } from '@/entities/meeting/model/types';

export type MeetingTimeFieldsProps = {
  value: MeetingDraft;
  onChange: (value: MeetingDraft) => void;
  errors: Record<string, string>;
};

export const MeetingTimeFields = ({
  value,
  onChange,
  errors,
}: MeetingTimeFieldsProps) => {
  return (
    <>
      <div className="form-time">
        <label>
          Дата и время
          <input
            type="datetime-local"
            required
            value={value.localTime}
            onChange={(event) =>
              onChange({ ...value, localTime: event.target.value, timeChoice: '' })
            }
            aria-invalid={!!errors.starts_at}
          />
        </label>
        <label>
          Часовой пояс
          <select
            value={value.timezone}
            onChange={(event) =>
              onChange({ ...value, timezone: event.target.value, timeChoice: '' })
            }
          >
            {![
              'Europe/Moscow',
              'Asia/Yekaterinburg',
              'Asia/Novosibirsk',
              'Europe/Berlin',
              'America/New_York',
              'UTC',
            ].includes(value.timezone) && (
              <option value={value.timezone}>{value.timezone}</option>
            )}
            <option value="Europe/Moscow">Москва · UTC+3</option>
            <option value="Asia/Yekaterinburg">Екатеринбург · UTC+5</option>
            <option value="Asia/Novosibirsk">Новосибирск · UTC+7</option>
            <option value="Europe/Berlin">Берлин</option>
            <option value="America/New_York">Нью-Йорк</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </div>
      {errors.starts_at && <span className="error">Проверьте время и часовой пояс.</span>}
      {errors.ambiguous && (
        <label>
          Повторяющееся время
          <select
            value={value.timeChoice}
            onChange={(event) =>
              onChange({
                ...value,
                timeChoice:
                  event.target.value === 'later'
                    ? 'later'
                    : event.target.value === 'earlier'
                      ? 'earlier'
                      : '',
              })
            }
          >
            <option value="">Выберите вариант</option>
            <option value="earlier">Ранний вариант — до перевода часов</option>
            <option value="later">Поздний вариант — после перевода часов</option>
          </select>
        </label>
      )}
    </>
  );
};
