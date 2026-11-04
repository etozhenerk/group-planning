import { useState } from "react";
import { DatePollCard } from "@/features/date-poll/ui/DatePollCard";
import { PlacePollCard } from "@/features/place-poll/ui/PlacePollCard";
import {
  meeting,
  session,
  datePoll,
  placePoll,
} from "@prototype/pages/entry/model/fixtures";
import styles from "@prototype/pages/entry/ui/PollStory/PollStory.module.css";

export const PollStory = () => {
  const [kind, setKind] = useState<"date" | "place">("date");
  return (
    <section
      id="decisions"
      className={styles.section}
      aria-labelledby="poll-title"
    >
      <div className={styles.stage}>
        <nav className={styles.tabs} aria-label="Пример голосования">
          <button
            type="button"
            aria-pressed={kind === "date"}
            onClick={() => setKind("date")}
          >
            За дату
          </button>
          <button
            type="button"
            aria-pressed={kind === "place"}
            onClick={() => setKind("place")}
          >
            За место
          </button>
        </nav>
        <div
          className={styles.card}
          inert
          role="img"
          aria-label={
            kind === "date"
              ? "Опрос о дате: большинство выбрало 8 ноября"
              : "Опрос о месте: большинство выбрало У Саши дома"
          }
          key={kind}
        >
          {kind === "date" ? (
            <DatePollCard
              meeting={meeting.id}
              id={datePoll.id}
              session={session}
              outgoing={false}
            />
          ) : (
            <PlacePollCard
              meeting={meeting.id}
              id={placePoll.id}
              session={session}
              author="Лена"
              occurredAt="2026-11-04T15:45:00Z"
            />
          )}
        </div>
      </div>
      <div className={styles.copy}>
        <h2 id="poll-title">
          {kind === "date" ? (
            <>
              Не получается в субботу?
              <br />
              Предложите другой день.
            </>
          ) : (
            <>
              Поменялись планы?
              <br />
              Предложите другое место.
            </>
          )}
        </h2>
        <p className={styles.summary}>
          {kind === "date"
            ? "Участники проголосуют за подходящий день. Если один вариант наберёт большинство, дата встречи изменится автоматически."
            : "Предложите новое место. Если после опроса большинство проголосовавших будет за, оно станет местом встречи."}
        </p>
      </div>
    </section>
  );
};
