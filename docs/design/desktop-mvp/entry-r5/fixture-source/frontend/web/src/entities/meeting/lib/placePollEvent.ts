import { z } from 'zod';
import type { WireEntry } from '@/shared/api';

const identity = z.object({ poll_id: z.uuid() });
const result = identity.extend({ state: z.enum(['applied', 'rejected']) });

export const placePollEvent = (
  wire: WireEntry,
): { event: string; placePollId?: string } | null => {
  if (wire.payload_version !== 1 || !identity.safeParse(wire.payload).success) {
    return null;
  }

  if (wire.kind === 'place_poll_created') {
    return {
      event: 'Предлагает новое место',
      placePollId: identity.parse(wire.payload).poll_id,
    };
  }

  if (wire.kind === 'place_poll_cancelled') {
    return { event: 'Опрос отменён: организатор изменил место.' };
  }

  if (wire.kind === 'place_poll_result') {
    const parsed = result.safeParse(wire.payload);

    return parsed.success
      ? {
          event:
            parsed.data.state === 'applied'
              ? 'Большинство выбрало новое место.'
              : 'Место осталось прежним.',
        }
      : null;
  }

  return null;
};
