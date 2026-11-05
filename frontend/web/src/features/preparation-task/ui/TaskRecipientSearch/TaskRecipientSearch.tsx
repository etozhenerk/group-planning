import { useState } from 'react';
import type { Participant } from '@/entities/meeting';
import { TaskRecipientRow } from '@/features/preparation-task/ui/TaskRecipientRow';
import styles from '@/features/preparation-task/ui/TaskRecipientSearch/TaskRecipientSearch.module.css';

export type TaskRecipientSearchProps = {
  people: Participant[];
  value: string;
  user: string;
  choose: (id: string) => void;
};

export const TaskRecipientSearch = ({
  people,
  value,
  user,
  choose,
}: TaskRecipientSearchProps) => {
  const [query, setQuery] = useState('');
  const filtered = people.filter((person) =>
    person.user.displayName.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  return (
    <div className={styles.picker}>
      <input
        aria-label="Поиск участника"
        placeholder="Имя участника"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={styles.list}>
        {!query && (
          <TaskRecipientRow
            name="Любому участнику"
            subtitle="Кто сможет, тот и возьмёт"
            selected={!value}
            choose={() => choose('')}
          />
        )}
        {filtered.map((person) => (
          <TaskRecipientRow
            key={person.user.id}
            person={person.user}
            name={person.user.displayName + (person.user.id === user ? ' · вы' : '')}
            subtitle={person.role === 'organizer' ? 'Организатор' : undefined}
            selected={value === person.user.id}
            choose={() => choose(person.user.id)}
          />
        ))}
        {filtered.length === 0 && query && (
          <p>Участник не найден. Попробуйте другое имя.</p>
        )}
      </div>
    </div>
  );
};
