import { ChatIcon } from '@/shared/ui/ChatIcon';
import { menuKey } from '@/widgets/conversation/ui/ActionMenu/hooks/menuKey';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import styles from '@/widgets/conversation/ui/ActionMenu/ActionMenu.module.css';
import { useMobileLayout } from '@/shared/lib/media';
import { useActionMenuPresence } from '@/widgets/conversation/ui/ActionMenu/hooks/useActionMenuPresence';

export type ActionMenuProps = {
  open: boolean;
  select: (value: ConversationActionKind) => void;
};

export const ActionMenu = ({ open, select }: ActionMenuProps) => {
  const mobile = useMobileLayout();
  const presence = useActionMenuPresence(open);

  if (!presence.visible) {
    return null;
  }

  return (
    <div
      className={styles.menu}
      role="menu"
      aria-label="Добавить к встрече"
      onKeyDown={menuKey}
      data-mobile={mobile}
      data-action-menu
      {...presence.props}
    >
      <button role="menuitem" type="button" onClick={() => select('photo')}>
        <ChatIcon name="photo" size={19} />
        Фото
      </button>
      <button role="menuitem" type="button" onClick={() => select('file')}>
        <ChatIcon name="file" size={19} />
        Файл
      </button>
      <button role="menuitem" type="button" onClick={() => select('date')}>
        <ChatIcon name="calendar" size={19} />
        Предложить дату
      </button>
      <button role="menuitem" type="button" onClick={() => select('place')}>
        <ChatIcon name="pin" size={19} />
        Предложить место
      </button>
      <button role="menuitem" type="button" onClick={() => select('task')}>
        <ChatIcon name="task" size={19} />
        Предложить задачу
      </button>
    </div>
  );
};
