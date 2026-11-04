import { mapPublicUser } from '@/shared/api';
import type { WirePreparationTask } from '@/shared/api';
import type { PreparationTask } from '@/entities/meeting/model/preparationTask';

export const mapPreparationTask = (wire: WirePreparationTask): PreparationTask => ({
  id: wire.id,
  meetingId: wire.meeting_id,
  title: wire.title,
  author: mapPublicUser(wire.author),
  recipient: wire.recipient ? mapPublicUser(wire.recipient) : null,
  assignee: wire.assignee ? mapPublicUser(wire.assignee) : null,
  updatedBy: mapPublicUser(wire.updated_by),
  state: wire.state,
  revision: wire.revision,
  createdAt: wire.created_at,
  canAccept: wire.can_accept,
  canDecline: wire.can_decline,
  canCancel: wire.can_cancel,
  canComplete: wire.can_complete,
});
