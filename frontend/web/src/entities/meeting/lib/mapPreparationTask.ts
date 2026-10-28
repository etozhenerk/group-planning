import type { WirePreparationTask } from '@/shared/api';
import type { PreparationTask } from '@/entities/meeting/model/preparationTask';

const person = (value: WirePreparationTask['author']) => ({
  id: value.id,
  displayName: value.display_name,
  avatarUrl: value.avatar_url ?? null,
});

export const mapPreparationTask = (wire: WirePreparationTask): PreparationTask => ({
  id: wire.id,
  meetingId: wire.meeting_id,
  title: wire.title,
  author: person(wire.author),
  recipient: wire.recipient ? person(wire.recipient) : null,
  assignee: wire.assignee ? person(wire.assignee) : null,
  updatedBy: person(wire.updated_by),
  state: wire.state,
  revision: wire.revision,
  createdAt: wire.created_at,
  canAccept: wire.can_accept,
  canDecline: wire.can_decline,
  canCancel: wire.can_cancel,
  canComplete: wire.can_complete,
});
