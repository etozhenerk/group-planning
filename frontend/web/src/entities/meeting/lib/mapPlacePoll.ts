import type { WirePlacePoll } from '@/shared/api';
import type { PlacePoll } from '@/entities/meeting/model/placePoll';

export const mapPlacePoll = (wire: WirePlacePoll): PlacePoll => ({
  id: wire.id,
  meetingId: wire.meeting_id,
  place: wire.place,
  previousPlace: wire.previous_place,
  state: wire.state,
  revision: wire.revision,
  myVoteRevision: wire.my_vote_revision,
  myVote: wire.my_vote,
  votesFor: wire.votes_for,
  votesAgainst: wire.votes_against,
  closesAt: wire.closes_at,
  canVote: wire.can_vote,
});
