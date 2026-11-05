import { designTokens } from '@/shared/config/design-tokens';
import type { Participant } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/features/preparation-task/ui/TaskRecipientSummary/TaskRecipientSummary.module.css';

export type TaskRecipientSummaryProps = {
  people: Participant[];
  value: string;
  user: string;
  disabled: boolean;
  open: () => void;
};

export const TaskRecipientSummary = ({
  people,
  value,
  user,
  disabled,
  open,
}: TaskRecipientSummaryProps) => {
  const person = people.find((item) => item.user.id === value)?.user;
  const name = !value
    ? 'Любому участнику'
    : person?.id === user
      ? 'Вам'
      : (person?.displayName ?? 'Участник вышел из встречи');

  return (
    <div className={styles.field}>
      <span>Кому предложить</span>
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        aria-label={`Кому предложить: ${name}`}
      >
        {person ? (
          <Avatar name={person.displayName} src={person.avatarUrl ?? null} size="small" />
        ) : (
          <span className={styles.any}>
            <ChatIcon name="people" size={designTokens.componentMobileRosterActionIcon} />
          </span>
        )}
        <span>{name}</span>
        <ChatIcon name="right" size={designTokens.componentMobileChatInlineTaskChevron} />
      </button>
    </div>
  );
};
