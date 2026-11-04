import { preparationTaskSchema, request, writeOptions } from '@/shared/api';
import { mapPreparationTask } from '@/entities/meeting/lib/mapPreparationTask';
import type {
  PreparationTaskCreate,
  PreparationActionInput,
} from '@/entities/meeting/model/preparationTask';

export const getPreparationTask = async (
  meeting: string,
  id: string,
  signal: AbortSignal,
) =>
  mapPreparationTask(
    await request(preparationTaskSchema, `/meetings/${meeting}/preparation-tasks/${id}`, {
      signal,
    }),
  );

export const createPreparationTask = async (
  meeting: string,
  input: PreparationTaskCreate,
  csrf: string | null,
  key: string,
) =>
  mapPreparationTask(
    await request(
      preparationTaskSchema,
      `/meetings/${meeting}/preparation-tasks`,
      writeOptions(
        'POST',
        csrf,
        { title: input.title, recipient_id: input.recipientId },
        key,
      ),
    ),
  );

export const actOnPreparationTask = async (
  meeting: string,
  id: string,
  input: PreparationActionInput,
  csrf: string | null,
  key: string,
) =>
  mapPreparationTask(
    await request(
      preparationTaskSchema,
      `/meetings/${meeting}/preparation-tasks/${id}/${input.action}`,
      writeOptions('POST', csrf, { expected_revision: input.revision }, key),
    ),
  );
