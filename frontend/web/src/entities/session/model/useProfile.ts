import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { request, uuid } from '@/shared/api';

const profileSchema = z.object({
  id: uuid,
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  provider: z.literal('yandex'),
  login: z.string().nullable().optional().default(null),
  first_name: z.string().nullable().optional().default(null),
  last_name: z.string().nullable().optional().default(null),
  birthday: z.string().nullable().optional().default(null),
  sex: z.string().nullable().optional().default(null),
});

export const useProfile = (user: string) =>
  useQuery({
    queryKey: ['profile', user],
    queryFn: ({ signal }) => request(profileSchema, '/me/profile', { signal }),
    retry: false,
  });
