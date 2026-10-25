import { z } from 'zod';

export const buildInfoSchema = z
  .object({
    schema_version: z.literal(1),
    component: z.literal('web'),
    version: z
      .string()
      .max(94)
      .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-rc\.[1-9]\d*)?$/),
    tag: z.string(),
    commit: z.string().regex(/^[0-9a-f]{40}$/),
    build_number: z.number().int().min(1).max(9999),
  })
  .strict()
  .refine((info) => info.tag === `web/v${info.version}`, 'Web tag and version differ');

export type BuildInfo = z.infer<typeof buildInfoSchema>;

export const buildIdentitySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('release'), info: buildInfoSchema }).strict(),
  z.object({ mode: z.literal('local') }).strict(),
  z.object({ mode: z.literal('demo') }).strict(),
]);

export type BuildIdentity = z.infer<typeof buildIdentitySchema>;

export const describeBuild = (value: unknown) => {
  const parsed = buildIdentitySchema.safeParse(value);

  if (!parsed.success) {
    return { label: 'Версия недоступна', number: null, version: null };
  }

  const identity = parsed.data;

  if (identity.mode !== 'release') {
    return {
      label: identity.mode === 'demo' ? 'Демо' : 'Локальная сборка',
      number: null,
      version: null,
    };
  }

  return {
    label: `Версия ${identity.info.version}`,
    number: identity.info.build_number,
    version: identity.info.version,
  };
};
