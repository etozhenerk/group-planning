import { RequiredMark } from '@/shared/ui/RequiredMark';
import { FieldError } from '@/shared/ui/FieldError';
import type { useTaskForm } from '@/features/preparation-task/model/useTaskForm';

export type TaskTitleFieldProps = {
  form: ReturnType<typeof useTaskForm>;
  classes: Readonly<Record<string, string>>;
};

export const TaskTitleField = ({ form, classes }: TaskTitleFieldProps) => (
  <div className={classes.field}>
    <label htmlFor="preparation-task-title">
      Что нужно сделать <RequiredMark />
    </label>
    <textarea
      id="preparation-task-title"
      value={form.title}
      onChange={(event) => form.setTitle(event.target.value)}
      disabled={form.locked}
      rows={2}
      maxLength={200}
      placeholder="Например, принести настолки"
      aria-invalid={!!form.titleError}
      aria-describedby={form.titleError ? 'task-title-error' : undefined}
      required
    />
    <FieldError id="task-title-error" error={form.titleError} decorated />
  </div>
);
