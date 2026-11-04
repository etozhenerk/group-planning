import { z } from 'zod';
import type { WireEntry } from '@/shared/api';

const payload = z.object({ task_id: z.uuid(), title: z.string() });
const labels: Record<string, string> = {
  preparation_task_created: 'Новая задача',
  preparation_task_accepted: 'Задача принята',
  preparation_task_declined: 'Отказ от задачи',
  preparation_task_cancelled: 'Задача отменена',
  preparation_task_completed: 'Задача выполнена',
};

export const preparationTaskEvent = (entry: WireEntry) => {
  if (entry.payload_version !== 1 || !labels[entry.kind]) {
    return null;
  }

  const parsed = payload.safeParse(entry.payload);

  if (!parsed.success) {
    return null;
  }

  return {
    event: `${labels[entry.kind]} · ${entry.actor.display_name} · «${parsed.data.title}»`,
    ...(entry.kind === 'preparation_task_created' ? { taskId: parsed.data.task_id } : {}),
  };
};
