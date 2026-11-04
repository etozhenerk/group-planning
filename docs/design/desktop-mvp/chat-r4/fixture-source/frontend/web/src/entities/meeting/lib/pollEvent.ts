import { z } from 'zod';
import type { WireEntry } from '@/shared/api';
import { dayLabel } from '@/shared/lib/time';

const pollPayload = z.object({ poll_id: z.uuid() });
const appliedPayload = pollPayload.extend({
  current: z.object({ starts_on: z.iso.date() }),
  previous: z.object({ starts_on: z.iso.date() }).optional(),
});

const notices: Record<string, string> = {
  date_poll_no_majority:
    'Ни одна дата не набрала большинства. Пока оставляем прежнюю — можно обсудить другие варианты и создать новый опрос.',
  date_poll_choice_required:
    'Несколько дат набрали одинаковое большинство. Организатор выберет одну из них в опросе.',
  date_poll_time_required:
    'День выбрали, но из-за перевода часов нужно уточнить время. Организатор сможет сделать это в опросе.',
  date_poll_cancelled: 'Организатор изменил дату встречи. Предыдущий опрос завершён.',
};

export const pollEvent = (wire: WireEntry): { event: string; pollId?: string } | null => {
  if (wire.payload_version !== 1) {
    return null;
  }

  if (wire.kind === 'meeting_time_unspecified') {
    return {
      event:
        'День встречи уже выбран. Осталось договориться о времени — обсудите его здесь, а организатор добавит в детали встречи.',
    };
  }

  const parsed = pollPayload.safeParse(wire.payload);

  if (!parsed.success) {
    return null;
  }

  if (wire.kind === 'date_poll_created') {
    return { event: 'Предлагает изменить дату', pollId: parsed.data.poll_id };
  }

  if (wire.kind === 'date_poll_applied') {
    const applied = appliedPayload.safeParse(wire.payload);

    return applied.success
      ? {
          event:
            applied.data.previous?.starts_on === applied.data.current.starts_on
              ? `Дату подтвердили: встречаемся ${dayLabel(applied.data.current.starts_on)}.`
              : `Встреча перенесена на ${dayLabel(applied.data.current.starts_on)} — эту дату выбрало большинство.`,
        }
      : null;
  }

  const event = notices[wire.kind];

  return event ? { event } : null;
};
