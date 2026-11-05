import { ActionNotice } from '@/shared/ui/ActionNotice';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';

export type PollSubmitProps = {
  mobile: boolean;
  problem: string;
  uncertain: boolean;
  failed: boolean;
  pending: boolean;
  errorClassName: string | undefined;
};

export const PollSubmit = (props: PollSubmitProps) => {
  const { mobile, problem, uncertain, failed, pending, errorClassName } = props;
  const title = uncertain
    ? 'Повторить отправку'
    : mobile && failed
      ? 'Попробовать снова'
      : 'Создать опрос';

  return (
    <>
      {problem &&
        (mobile && failed ? (
          <ActionNotice
            title={
              uncertain ? 'Создание опроса не подтверждено' : 'Не удалось создать опрос'
            }
            text={
              uncertain
                ? 'Повторите отправку — данные менять не нужно.'
                : 'Варианты и настройки остались в форме.'
            }
          />
        ) : (
          <p role="alert" className={errorClassName}>
            {problem}
          </p>
        ))}
      <button type="submit" disabled={pending} aria-busy={pending} aria-label={title}>
        {pending ? <ButtonSpinner /> : title}
      </button>
    </>
  );
};
