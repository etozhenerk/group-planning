import { TaskTitleField } from '@/features/preparation-task/ui/TaskTitleField';
import { RequiredMark } from '@/shared/ui/RequiredMark';
import { RequiredLegend } from '@/shared/ui/RequiredLegend';
import type { useFormViewport } from '@/shared/lib/form';
import type { useTaskForm } from '@/features/preparation-task/model/useTaskForm';
import { TaskRecipient } from '@/features/preparation-task/ui/TaskRecipient';

export type TaskFormBodyProps = {
  form: ReturnType<typeof useTaskForm>;
  scroll: ReturnType<typeof useFormViewport>;
  mobile: boolean;
  user: string;
  classes: Readonly<Record<string, string>>;
  select: () => void;
};

export const TaskFormBody = ({
  form,
  scroll,
  mobile,
  user,
  classes,
  select,
}: TaskFormBodyProps) => (
  <div className={classes.body} ref={scroll.viewport} onScroll={scroll.update}>
    <div ref={scroll.content}>
      {mobile ? (
        <p className={classes.legend}>
          <RequiredMark /> Обязательное поле
        </p>
      ) : (
        <RequiredLegend spaced />
      )}
      {mobile ? (
        <TaskTitleField form={form} classes={classes} />
      ) : (
        <label className={classes.field}>
          Что сделать <RequiredMark />
          <input
            value={form.title}
            onChange={(event) => form.setTitle(event.target.value)}
            disabled={form.locked}
            required
          />
        </label>
      )}
      <TaskRecipient
        people={form.participants}
        error={!!form.people.error}
        retry={() => void form.people.refetch()}
        value={form.recipient}
        onChange={form.setRecipient}
        disabled={form.locked}
        user={user}
        open={select}
      />
      {mobile && (
        <p className={classes.note}>Исполнитель появится после принятия задачи.</p>
      )}
    </div>
  </div>
);
