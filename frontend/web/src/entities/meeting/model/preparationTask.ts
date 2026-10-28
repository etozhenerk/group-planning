import type { WirePreparationTask } from '@/shared/api';

export type TaskPerson = { id: string; displayName: string; avatarUrl: string | null };

export type PreparationTask = {
  id: string;
  meetingId: string;
  title: string;
  author: TaskPerson;
  recipient: TaskPerson | null;
  assignee: TaskPerson | null;
  updatedBy: TaskPerson;
  state: WirePreparationTask['state'];
  revision: string;
  createdAt: string;
  canAccept: boolean;
  canDecline: boolean;
  canCancel: boolean;
  canComplete: boolean;
};

export type PreparationTaskCreate = { title: string; recipientId: string | null };

export type PreparationAction = 'accept' | 'decline' | 'cancel' | 'complete';

export type PreparationActionInput = { action: PreparationAction; revision: string };
