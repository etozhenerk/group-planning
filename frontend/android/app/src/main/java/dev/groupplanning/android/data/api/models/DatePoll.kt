@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class DatePoll(
    val id: UUID,
    @SerialName("meeting_id") val meetingId: UUID,
    val author: UserProfile,
    val settings: DatePollSettings,
    val options: List<DatePollOption>,
    val state: String,
    val revision: ServerCounter,
    @SerialName("my_vote_revision") val myVoteRevision: ServerCounter,
    @SerialName("my_option_ids") val myOptionIds: List<UUID>,
    @SerialName("created_at") val createdAt: ApiInstant,
    @SerialName("closes_at") val closesAt: ApiInstant,
    @SerialName("closed_at") val closedAt: ApiInstant?,
    @SerialName("leader_option_ids") val leaderOptionIds: List<UUID>,
    @SerialName("applied_option_id") val appliedOptionId: UUID?,
    @SerialName("can_vote") val canVote: Boolean,
    @SerialName("can_add_options") val canAddOptions: Boolean,
    @SerialName("can_resolve") val canResolve: Boolean,
)

@Serializable
internal data class DatePollSettings(
    @SerialName("multiple_answers") val multipleAnswers: Boolean = true,
    @SerialName("allow_revoting") val allowRevoting: Boolean = true,
    @SerialName("allow_new_options") val allowNewOptions: Boolean = true,
    val anonymous: Boolean = false,
    @SerialName("hide_results") val hideResults: Boolean = false,
)

@Serializable
internal data class DatePollOption(
    val id: UUID,
    val date: String,
    val votes: Int?,
    val voters: List<UserProfile>?,
)
