import type { WireDatePoll } from '@/shared/api';
import type { DatePoll, PollSettings } from '@/entities/meeting/model/datePoll';

export const mapDatePoll = (wire: WireDatePoll): DatePoll => ({
  id: wire.id,
  meetingId: wire.meeting_id,
  author: { id: wire.author.id, displayName: wire.author.display_name },
  settings: {
    multipleAnswers: wire.settings.multiple_answers,
    allowRevoting: wire.settings.allow_revoting,
    allowNewOptions: wire.settings.allow_new_options,
    anonymous: wire.settings.anonymous,
    hideResults: wire.settings.hide_results,
  },
  options: wire.options.map((option) => ({
    ...option,
    voters:
      option.voters?.map((voter) => ({
        id: voter.id,
        displayName: voter.display_name,
      })) ?? null,
  })),
  state: wire.state,
  revision: wire.revision,
  myVoteRevision: wire.my_vote_revision,
  myOptionIds: wire.my_option_ids,
  createdAt: wire.created_at,
  closesAt: wire.closes_at,
  closedAt: wire.closed_at,
  leaderOptionIds: wire.leader_option_ids,
  appliedOptionId: wire.applied_option_id,
  canVote: wire.can_vote,
  canAddOptions: wire.can_add_options,
  canResolve: wire.can_resolve,
});

export const wirePollSettings = (settings: PollSettings) => ({
  multiple_answers: settings.multipleAnswers,
  allow_revoting: settings.allowRevoting,
  allow_new_options: settings.allowNewOptions,
  anonymous: settings.anonymous,
  hide_results: settings.hideResults,
});
