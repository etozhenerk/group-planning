import type { Invitation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { Answer } from '@/shared/api';

export type ResponseRequest = {
  session: Session;
  id: string;
  token?: string | undefined;
  expected: string;
  title: string;
  preview: Invitation;
  current: Answer | null;
  answer: Answer;
};
