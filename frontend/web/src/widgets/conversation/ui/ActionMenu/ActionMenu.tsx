import { menuKey } from '@/widgets/conversation/ui/ActionMenu/hooks/menuKey';
import { Image, File, Calendar, MapPin, ListTodo } from 'lucide-react';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import styles from '@/widgets/conversation/ui/ActionMenu/ActionMenu.module.css';

export type ActionMenuProps = { select: (value: ConversationActionKind) => void };

export const ActionMenu = ({ select }: ActionMenuProps) => (
  <div
    className={styles.menu}
    role="menu"
    aria-label="Добавить к встрече"
    onKeyDown={menuKey}
  >
    <button role="menuitem" type="button" onClick={() => select('photo')}>
      <Image size={19} />
      Фото
    </button>
    <button role="menuitem" type="button" onClick={() => select('file')}>
      <File size={19} />
      Файл
    </button>
    <button role="menuitem" type="button" onClick={() => select('date')}>
      <Calendar size={19} />
      Предложить дату
    </button>
    <button role="menuitem" type="button" onClick={() => select('place')}>
      <MapPin size={19} />
      Предложить место
    </button>
    <button role="menuitem" type="button" onClick={() => select('task')}>
      <ListTodo size={19} />
      Предложить задачу
    </button>
  </div>
);
