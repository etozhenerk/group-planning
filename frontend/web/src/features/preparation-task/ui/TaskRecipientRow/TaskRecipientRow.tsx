import { designTokens } from '@/shared/config/design-tokens';
import type { Participant } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/features/preparation-task/ui/TaskRecipientRow/TaskRecipientRow.module.css';

export type TaskRecipientRowProps = {
  person?: Participant['user'];
  name: string;
  subtitle?: string | undefined;
  selected: boolean;
  choose: () => void;
};

export const TaskRecipientRow = ({
  person,
  name,
  subtitle,
  selected,
  choose,
}: TaskRecipientRowProps) => (
  <button type="button" className={styles.row} onClick={choose} aria-pressed={selected}>
    {person ? (
      <Avatar name={person.displayName} src={person.avatarUrl ?? null} size="small" />
    ) : (
      <ChatIcon name="people" size={designTokens.componentMobileAvatarSmallSize} />
    )}
    <span>
      <strong>{name}</strong>
      {subtitle && <small>{subtitle}</small>}
    </span>
    {selected && (
      <span className={styles.check} aria-hidden="true">
        ✓
      </span>
    )}
  </button>
);
