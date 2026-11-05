import type { Answer } from '@/shared/api';

export const responseDestination = (id: string, answer: Answer) => {
  switch (answer) {
    case 'going':
      return `/meetings/${encodeURIComponent(id)}`;
    case 'maybe':
      return '/invitations';
    case 'not_going':
      return `/meetings/${encodeURIComponent(id)}/declined`;
  }
};
