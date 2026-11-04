import { useState } from "react";
import type { TaskPerson } from "@/entities/meeting";
import { Avatar } from "@/shared/ui/Avatar";
import { Users, Check, Search } from "lucide-react";
import styles from "@preview/ui/RecipientPicker/RecipientPicker.module.css";
export type RecipientPickerProps = {
  value: string;
  people: TaskPerson[];
  choose: (id: string) => void;
};
export const RecipientPicker = ({
  value,
  people,
  choose,
}: RecipientPickerProps) => {
  const [query, setQuery] = useState(""),
    filtered = people.filter((person) =>
      person.displayName.toLowerCase().includes(query.trim().toLowerCase()),
    );
  return (
    <div className={styles.picker}>
      <div className={styles.search}>
        <Search size={18} />
        <input
          aria-label="Поиск участника"
          placeholder="Имя участника"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className={styles.list}>
        {!query && (
          <button
            type="button"
            className={styles.row}
            aria-pressed={!value}
            onClick={() => choose("")}
          >
            <span className={styles.any}>
              <Users size={22} />
            </span>
            <span>
              <strong>Любому участнику</strong>
              <small>Кто сможет, тот и возьмёт</small>
            </span>
            {!value && <Check size={18} />}
          </button>
        )}
        {filtered.map((person) => (
          <button
            key={person.id}
            type="button"
            className={styles.row}
            aria-pressed={value === person.id}
            onClick={() => choose(person.id)}
          >
            <Avatar
              name={person.displayName}
              src={person.avatarUrl}
              size="small"
            />
            <span>
              <strong>
                {person.displayName}
                {person.id === "misha" ? " · вы" : ""}
              </strong>
              {person.id === "lena" && <small>Организатор</small>}
            </span>
            {value === person.id && <Check size={18} />}
          </button>
        ))}
        {!filtered.length && (
          <p className={styles.empty}>
            Участник не найден. Попробуйте другое имя.
          </p>
        )}
      </div>
    </div>
  );
};
