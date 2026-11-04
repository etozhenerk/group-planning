import { TaskCard } from "@/features/preparation-task/ui/TaskCard";
import { meeting, session, task } from "@prototype/pages/entry/model/fixtures";
import styles from "@prototype/pages/entry/ui/Planning/Planning.module.css";

export const Planning = () => (
  <section className={styles.section} aria-labelledby="task-title">
    <div className={styles.column}>
      <h2 id="task-title">
        Кто за пиццей?
        <br />А кто берёт игру?
      </h2>
      <p>
        Друг станет ответственным, когда примет предложенную задачу. Когда всё
        будет готово, он сможет отметить её выполненной.
      </p>
    </div>
    <div
      className={styles.task}
      inert
      role="img"
      aria-label="Задача Заказать пиццу, принята Мишей"
    >
      <TaskCard
        meeting={meeting.id}
        id={task.id}
        session={session}
        occurredAt={task.createdAt}
      />
    </div>
  </section>
);
